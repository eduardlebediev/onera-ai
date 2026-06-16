import "server-only"

import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import { getPersistedFollowUpsForAttempt } from "@/features/employee/tests/lib/supabase-employee-follow-ups"
import {
  INACTIVE_TEST_START_MESSAGE,
  isTestAssignable,
} from "@/features/tests/lib/test-source-validity-style"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocale } from "@/shared/i18n/get-locale"
import { parseCorrectAnswer, parseOptions, parseUserAnswer } from "@/shared/db/parse-json-fields"

import { formatOptionTexts } from "./attempt-answer-format"
import { getActiveAttempt, getAttemptById, getCompletedAttemptCount } from "./attempt-queries"
import { buildWeakTopicsFromReview, resolveAttemptAiFeedback } from "./attempt-feedback"
import {
  isMissingMaxAttemptsColumnError,
  warnMissingMaxAttemptsFallback,
} from "./supabase-schema-drift"
import type { AnswerRow, QuestionScoringRow, ResultTestRow } from "./supabase-employee-attempts"

const RESULT_TEST_SELECT =
  "id, title, description, passing_score, source_document_id, status, is_active, source_validity, max_attempts"

const LEGACY_RESULT_TEST_SELECT =
  "id, title, description, passing_score, source_document_id, status, is_active, source_validity"

function normalizeResultTestRow(row: unknown | null): ResultTestRow | null {
  if (!row) return null

  const test = row as Partial<ResultTestRow>

  return {
    ...test,
    max_attempts: test.max_attempts ?? null,
  } as ResultTestRow
}

async function getResultTestRow(input: {
  testId: string
  organizationId: string
}): Promise<ResultTestRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select(RESULT_TEST_SELECT)
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error && isMissingMaxAttemptsColumnError(error)) {
    warnMissingMaxAttemptsFallback()

    const { data: legacyData, error: legacyError } = await supabase
      .from("tests")
      .select(LEGACY_RESULT_TEST_SELECT)
      .eq("id", input.testId)
      .eq("organization_id", input.organizationId)
      .maybeSingle()

    if (legacyError) {
      throw new Error(`Failed to fetch test for result: ${legacyError.message}`)
    }

    return normalizeResultTestRow(legacyData)
  }

  if (error) {
    throw new Error(`Failed to fetch test for result: ${error.message}`)
  }

  return normalizeResultTestRow(data)
}

export async function getPersistedEmployeeTestResult(
  testId: string,
  attemptId: string,
  userId: string,
  organizationId: string
): Promise<EmployeeTestResult | null> {
  const attempt = await getAttemptById(attemptId)
  if (
    !attempt ||
    attempt.test_id !== testId ||
    attempt.user_id !== userId ||
    attempt.organization_id !== organizationId
  ) {
    return null
  }

  if (attempt.status !== "completed" || attempt.score === null || attempt.passed === null) {
    return null
  }

  const supabase = createAdminClient()

  const [test, { data: answerRows, error: answersError }] = await Promise.all([
    getResultTestRow({ testId, organizationId }),
    supabase
      .from("test_answers")
      .select("id, question_id, user_answer, is_correct")
      .eq("attempt_id", attemptId),
  ])

  if (answersError) {
    throw new Error(`Failed to fetch answers for result: ${answersError.message}`)
  }

  if (!test) return null

  const { data: questions, error: questionsError } = await supabase
    .from("test_questions")
    .select(
      "id, question_text, question_type, options, correct_answer, explanation, topic, source_chunk_id, order_index"
    )
    .eq("test_id", testId)
    .eq("organization_id", organizationId)
    .order("order_index", { ascending: true })

  if (questionsError) {
    throw new Error(`Failed to fetch questions for result: ${questionsError.message}`)
  }

  let sourceDocumentTitle = "Unknown document"
  let sourceDocumentId = test.source_document_id ?? testId

  if (test.source_document_id) {
    const { data: document } = await supabase
      .from("documents")
      .select("id, title")
      .eq("id", test.source_document_id)
      .maybeSingle()

    if (document) {
      sourceDocumentTitle = document.title
      sourceDocumentId = document.id
    }
  }

  const answersByQuestionId = new Map(
    ((answerRows ?? []) as AnswerRow[]).map((row) => [row.question_id, row])
  )

  const answerReview = ((questions ?? []) as QuestionScoringRow[]).map((question) => {
    const options = parseOptions(question.options)
    const correctAnswer = parseCorrectAnswer(question.correct_answer)
    const savedAnswer = answersByQuestionId.get(question.id)
    const parsedAnswer = savedAnswer ? parseUserAnswer(savedAnswer.user_answer) : null
    const selectedOptionIds = parsedAnswer?.selectedOptionIds ?? []
    const openText = parsedAnswer?.openText
    const isCorrect = savedAnswer?.is_correct ?? false
    const employeeAnswer =
      question.question_type === "open_question"
        ? openText?.trim() || "—"
        : formatOptionTexts(options, selectedOptionIds)
    const correctAnswerText =
      question.question_type === "open_question"
        ? (correctAnswer.expectedAnswer ?? "—")
        : formatOptionTexts(options, correctAnswer.optionIds)
    const explanation =
      question.question_type === "open_question" && parsedAnswer?.needsManualReview
        ? [
            question.explanation,
            parsedAnswer.gradingRationale ?? "AI grading failed — needs manual review.",
          ]
            .filter((value): value is string => Boolean(value))
            .join(" ")
        : (question.explanation ?? "")

    return {
      questionId: question.id,
      questionText: question.question_text,
      employeeAnswer,
      correctAnswer: correctAnswerText,
      isCorrect,
      explanation,
      topic: question.topic ?? "General",
      sourceChunkReference: question.source_chunk_id
        ? `Chunk (${question.source_chunk_id.slice(0, 8)}…)`
        : "Source document",
    }
  })

  const correctCount = answerReview.filter((item) => item.isCorrect).length
  const wrongCount = answerReview.length - correctCount
  const score = attempt.score
  const passed = attempt.passed
  const attemptCount = await getCompletedAttemptCount({
    userId,
    testId,
    organizationId,
  })
  const maxAttempts = test.max_attempts ?? 3
  const sourceIsRetakeable = isTestAssignable({
    status: test.status,
    isActive: test.is_active ?? true,
    sourceValidity: test.source_validity ?? "valid",
  })
  const activeAttempt = !passed ? await getActiveAttempt(userId, testId) : null
  const canRetake = !passed && attemptCount < maxAttempts && sourceIsRetakeable && !activeAttempt
  const retakeDisabledReason = passed
    ? undefined
    : !sourceIsRetakeable
      ? INACTIVE_TEST_START_MESSAGE
      : attemptCount >= maxAttempts
        ? `Maximum attempts reached (${maxAttempts}).`
        : activeAttempt
          ? "A retake is already in progress."
          : undefined

  const startedAt = attempt.started_at ? new Date(attempt.started_at).getTime() : null
  const completedAt = attempt.completed_at ? new Date(attempt.completed_at).getTime() : null
  const timeSpentMinutes =
    startedAt && completedAt ? Math.max(1, Math.round((completedAt - startedAt) / 60000)) : 10

  const followUpsByOriginalQuestionId = await getPersistedFollowUpsForAttempt(
    attemptId,
    organizationId
  )
  const locale = await getLocale()

  return {
    id: testId,
    attemptId: attempt.id,
    title: test.title,
    description: test.description ?? "",
    sourceDocument: sourceDocumentTitle,
    sourceDocumentId,
    passingScore: test.passing_score,
    score,
    passed,
    status: passed ? "passed" : "failed",
    completedDate: (attempt.completed_at ?? new Date().toISOString()).slice(0, 10),
    timeSpentMinutes,
    totalQuestions: answerReview.length,
    correctCount,
    wrongCount,
    answerReview,
    weakTopics: buildWeakTopicsFromReview(answerReview),
    aiFeedback: resolveAttemptAiFeedback(
      attempt.ai_feedback,
      test.title,
      score,
      passed,
      answerReview,
      locale
    ),
    canRetake,
    retakeDisabledReason,
    attemptCount,
    maxAttempts,
    followUpsByOriginalQuestionId,
  }
}

export async function getLatestCompletedAttemptIdForAssignment(
  userId: string,
  testId: string,
  organizationId: string
): Promise<{ attemptId: string; score: number; passed: boolean } | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, score, passed")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch latest attempt: ${error.message}`)
  }

  if (!data || data.score === null || data.passed === null) {
    return null
  }

  return {
    attemptId: data.id,
    score: data.score,
    passed: data.passed,
  }
}
