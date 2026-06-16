import "server-only"

import type { PostgrestError } from "@supabase/supabase-js"

import { gradeOpenQuestionAnswer } from "@/features/employee/tests/lib/grade-open-question"
import {
  INACTIVE_TEST_START_MESSAGE,
  isTestAssignable,
} from "@/features/tests/lib/test-source-validity-style"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocale } from "@/shared/i18n/get-locale"
import type { Json } from "@/lib/supabase/types"
import { parseCorrectAnswer, parseOptions } from "@/shared/db/parse-json-fields"

import { formatOptionTexts } from "./attempt-answer-format"
import { getAttemptById } from "./attempt-queries"
import { buildAttemptFeedbackInput, persistAttemptFeedbackBestEffort } from "./attempt-feedback"
import type {
  QuestionScoringRow,
  SubmitAnswerInput,
  SubmitAttemptResult,
} from "./supabase-employee-attempts"

type ScoredAnswer = {
  question: QuestionScoringRow
  options: Array<{ id: string; text: string }>
  correctAnswer: { optionIds: string[]; expectedAnswer?: string }
  selectedOptionIds: string[]
  openText?: string
  isCorrect: boolean
  employeeAnswer: string
  correctAnswerText: string
  gradingRationale?: string
  needsManualReview?: boolean
}

type CompleteTestAttemptRpc = (
  fn: "complete_test_attempt",
  args: {
    p_attempt_id: string
    p_test_id: string
    p_user_id: string
    p_organization_id: string
    p_score: number
    p_passed: boolean
    p_completed_at: string
    p_answers: Json
  }
) => Promise<{ data: unknown[] | null; error: PostgrestError | null }>

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

function isAnswerCorrect(
  questionType: string,
  correctOptionIds: string[],
  selectedOptionIds: string[]
): boolean {
  if (questionType === "multiple_choice") {
    return setsEqual(correctOptionIds, selectedOptionIds)
  }

  if (questionType === "single_choice" || questionType === "true_false") {
    return (
      selectedOptionIds.length === 1 &&
      correctOptionIds.length === 1 &&
      selectedOptionIds[0] === correctOptionIds[0]
    )
  }

  return false
}

async function scoreQuestionAnswer(input: {
  question: QuestionScoringRow
  options: Array<{ id: string; text: string }>
  correctAnswer: { optionIds: string[]; expectedAnswer?: string }
  selectedOptionIds: string[]
  openText?: string
}): Promise<{
  isCorrect: boolean
  employeeAnswer: string
  correctAnswer: string
  gradingRationale?: string
  needsManualReview?: boolean
}> {
  if (input.question.question_type === "open_question") {
    const employeeAnswer = input.openText?.trim() ?? ""
    const expectedAnswer = input.correctAnswer.expectedAnswer ?? ""

    const grading = await gradeOpenQuestionAnswer({
      questionText: input.question.question_text,
      expectedAnswer,
      employeeAnswer,
      explanation: input.question.explanation,
    })

    return {
      isCorrect: grading.isCorrect,
      employeeAnswer: employeeAnswer || "—",
      correctAnswer: expectedAnswer || "—",
      gradingRationale: grading.rationale,
      needsManualReview: grading.needsManualReview,
    }
  }

  const isCorrect = isAnswerCorrect(
    input.question.question_type,
    input.correctAnswer.optionIds,
    input.selectedOptionIds
  )

  return {
    isCorrect,
    employeeAnswer: formatOptionTexts(input.options, input.selectedOptionIds),
    correctAnswer: formatOptionTexts(input.options, input.correctAnswer.optionIds),
  }
}

export type SubmitAttemptErrorCode =
  | "not_found"
  | "forbidden"
  | "already_completed"
  | "invalid_questions"

export class SubmitAttemptError extends Error {
  constructor(
    message: string,
    public code: SubmitAttemptErrorCode
  ) {
    super(message)
    this.name = "SubmitAttemptError"
  }
}

export async function submitEmployeeTestAttempt(input: {
  testId: string
  attemptId: string
  answers: SubmitAnswerInput[]
  userId: string
  organizationId: string
}): Promise<SubmitAttemptResult> {
  const { userId, organizationId } = input
  const attempt = await getAttemptById(input.attemptId)

  if (!attempt) {
    throw new SubmitAttemptError("Attempt not found", "not_found")
  }

  if (
    attempt.user_id !== userId ||
    attempt.test_id !== input.testId ||
    attempt.organization_id !== organizationId
  ) {
    throw new SubmitAttemptError("Attempt does not belong to this test", "forbidden")
  }

  if (attempt.status === "completed" && attempt.score !== null && attempt.passed !== null) {
    return {
      attemptId: attempt.id,
      score: attempt.score,
      passed: attempt.passed,
      redirectTo: `/employee/tests/${input.testId}/result?attemptId=${attempt.id}`,
    }
  }

  if (attempt.status !== "in_progress") {
    throw new SubmitAttemptError("Attempt is already completed", "already_completed")
  }

  const supabase = createAdminClient()

  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select("status, is_active, source_validity")
    .eq("id", input.testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (testError) {
    throw new Error(`Failed to fetch test: ${testError.message}`)
  }

  if (
    !testRow ||
    !isTestAssignable({
      status: testRow.status,
      isActive: testRow.is_active ?? true,
      sourceValidity: testRow.source_validity ?? "valid",
    })
  ) {
    throw new SubmitAttemptError(INACTIVE_TEST_START_MESSAGE, "forbidden")
  }

  const { data: questions, error: questionsError } = await supabase
    .from("test_questions")
    .select(
      "id, question_text, question_type, options, correct_answer, explanation, topic, source_chunk_id"
    )
    .eq("test_id", input.testId)
    .eq("organization_id", organizationId)
    .order("order_index", { ascending: true })

  if (questionsError) {
    throw new Error(`Failed to fetch questions for scoring: ${questionsError.message}`)
  }

  const questionRows = (questions ?? []) as QuestionScoringRow[]
  if (questionRows.length === 0) {
    throw new SubmitAttemptError("Test has no questions", "invalid_questions")
  }

  const answersByQuestionId = new Map(input.answers.map((answer) => [answer.questionId, answer]))
  const scoredAnswers: ScoredAnswer[] = []

  for (const question of questionRows) {
    const options = parseOptions(question.options)
    const correctAnswer = parseCorrectAnswer(question.correct_answer)
    const submittedAnswer = answersByQuestionId.get(question.id)
    const selectedOptionIds = submittedAnswer?.selectedOptionIds ?? []
    const openText = submittedAnswer?.openText
    const scored = await scoreQuestionAnswer({
      question,
      options,
      correctAnswer,
      selectedOptionIds,
      openText,
    })

    scoredAnswers.push({
      question,
      options,
      correctAnswer,
      selectedOptionIds,
      openText,
      isCorrect: scored.isCorrect,
      employeeAnswer: scored.employeeAnswer,
      correctAnswerText: scored.correctAnswer,
      gradingRationale: scored.gradingRationale,
      needsManualReview: scored.needsManualReview,
    })
  }

  const correctCount = scoredAnswers.filter((item) => item.isCorrect).length
  const totalQuestions = scoredAnswers.length
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100)

  const { data: testMeta, error: testMetaError } = await supabase
    .from("tests")
    .select("title, description, passing_score")
    .eq("id", input.testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (testMetaError || !testMeta) {
    throw new Error(`Failed to fetch test passing score: ${testMetaError?.message ?? "not found"}`)
  }

  const passed = score >= testMeta.passing_score
  const now = new Date().toISOString()

  const answerPayload = scoredAnswers.map((item) => ({
    question_id: item.question.id,
    user_answer:
      item.question.question_type === "open_question"
        ? ({
            openText: item.openText ?? "",
            gradingRationale: item.gradingRationale,
            needsManualReview: item.needsManualReview,
          } satisfies Json)
        : ({ selectedOptionIds: item.selectedOptionIds } satisfies Json),
    is_correct: item.isCorrect,
  }))

  const { data: completedAttemptRows, error: completeAttemptError } = await (
    supabase.rpc as unknown as CompleteTestAttemptRpc
  )("complete_test_attempt", {
    p_attempt_id: attempt.id,
    p_test_id: input.testId,
    p_user_id: userId,
    p_organization_id: organizationId,
    p_score: score,
    p_passed: passed,
    p_completed_at: now,
    p_answers: answerPayload as unknown as Json,
  })

  if (completeAttemptError) {
    if (completeAttemptError.message.includes("already")) {
      throw new SubmitAttemptError("Attempt is already completed", "already_completed")
    }

    throw new Error(`Failed to complete test attempt: ${completeAttemptError.message}`)
  }

  if (!completedAttemptRows || completedAttemptRows.length === 0) {
    throw new SubmitAttemptError("Attempt is already completed", "already_completed")
  }

  await persistAttemptFeedbackBestEffort(attempt.id, {
    language: await getLocale(),
    testTitle: testMeta.title,
    testDescription: testMeta.description,
    score,
    passed,
    passingScore: testMeta.passing_score,
    answers: buildAttemptFeedbackInput(
      scoredAnswers.map((item) => ({
        question: item.question,
        employeeAnswer: item.employeeAnswer,
        correctAnswer: item.correctAnswerText,
        isCorrect: item.isCorrect,
      }))
    ),
  })

  return {
    attemptId: attempt.id,
    score,
    passed,
    redirectTo: `/employee/tests/${input.testId}/result?attemptId=${attempt.id}`,
  }
}
