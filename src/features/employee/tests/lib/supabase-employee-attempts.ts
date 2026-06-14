import "server-only"

import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import {
  generateAttemptFeedbackBestEffort,
  type AttemptFeedbackAnswerInput,
} from "@/features/employee/tests/lib/generate-attempt-feedback"
import { getPersistedFollowUpsForAttempt } from "@/features/employee/tests/lib/supabase-employee-follow-ups"
import { gradeOpenQuestionAnswer } from "@/features/employee/tests/lib/grade-open-question"
import {
  parseAttemptFeedbackEnvelope,
  serializeAttemptFeedbackEnvelope,
} from "@/features/employee/tests/schemas/attempt-feedback-schema"
import {
  INACTIVE_TEST_START_MESSAGE,
  isTestAssignable,
} from "@/features/tests/lib/test-source-validity-style"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

import { getAssignmentForEmployee, isAssignmentTakeable } from "./supabase-employee-tests"
import {
  isMissingMaxAttemptsColumnError,
  warnMissingMaxAttemptsFallback,
} from "./supabase-schema-drift"

export type StartAttemptResult = {
  attemptId: string
  testId: string
}

export type SubmitAnswerInput = {
  questionId: string
  selectedOptionIds?: string[]
  openText?: string
}

export type SubmitAttemptResult = {
  attemptId: string
  score: number
  passed: boolean
  redirectTo: string
}

type AttemptRow = {
  id: string
  organization_id: string
  test_id: string
  user_id: string
  assignment_id: string | null
  status: string
  score: number | null
  passed: boolean | null
  ai_feedback: string | null
  started_at: string | null
  completed_at: string | null
}

type TestAttemptPolicyRow = {
  id: string
  organization_id: string
  status: string
  is_active: boolean | null
  source_validity: string | null
  max_attempts: number | null
}

type QuestionScoringRow = {
  id: string
  question_text: string
  question_type: string
  options: Json
  correct_answer: Json
  explanation: string | null
  topic: string | null
  source_chunk_id: string | null
}

type AnswerRow = {
  id: string
  question_id: string
  user_answer: Json
  is_correct: boolean | null
}

type ResultTestRow = {
  id: string
  title: string
  description: string | null
  passing_score: number
  source_document_id: string | null
  status: string
  is_active: boolean | null
  source_validity: string | null
  max_attempts: number | null
}

const TEST_ATTEMPT_POLICY_SELECT =
  "id, organization_id, status, is_active, source_validity, max_attempts"

const LEGACY_TEST_ATTEMPT_POLICY_SELECT = "id, organization_id, status, is_active, source_validity"

const RESULT_TEST_SELECT =
  "id, title, description, passing_score, source_document_id, status, is_active, source_validity, max_attempts"

const LEGACY_RESULT_TEST_SELECT =
  "id, title, description, passing_score, source_document_id, status, is_active, source_validity"

function normalizeTestAttemptPolicyRow(row: unknown | null): TestAttemptPolicyRow | null {
  if (!row) return null

  const test = row as Partial<TestAttemptPolicyRow>

  return {
    ...test,
    max_attempts: test.max_attempts ?? null,
  } as TestAttemptPolicyRow
}

function normalizeResultTestRow(row: unknown | null): ResultTestRow | null {
  if (!row) return null

  const test = row as Partial<ResultTestRow>

  return {
    ...test,
    max_attempts: test.max_attempts ?? null,
  } as ResultTestRow
}

function parseOptions(value: Json): Array<{ id: string; text: string }> {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "text" in item &&
      typeof item.id === "string" &&
      typeof item.text === "string"
    ) {
      return [{ id: item.id, text: item.text }]
    }

    return []
  })
}

function parseCorrectAnswer(value: Json): { optionIds: string[]; expectedAnswer?: string } {
  if (typeof value !== "object" || value === null) {
    return { optionIds: [] }
  }

  const record = value as Record<string, unknown>
  const optionIds = Array.isArray(record.optionIds)
    ? record.optionIds.filter((optionId): optionId is string => typeof optionId === "string")
    : []
  const expectedAnswer =
    typeof record.expectedAnswer === "string" ? record.expectedAnswer : undefined

  return { optionIds, expectedAnswer }
}

function parseUserAnswer(value: Json): {
  selectedOptionIds: string[]
  openText?: string
  gradingRationale?: string
  needsManualReview?: boolean
} {
  if (typeof value !== "object" || value === null) {
    return { selectedOptionIds: [] }
  }

  const record = value as Record<string, unknown>
  const selectedOptionIds = Array.isArray(record.selectedOptionIds)
    ? record.selectedOptionIds.filter((id): id is string => typeof id === "string")
    : []
  const openText = typeof record.openText === "string" ? record.openText : undefined
  const gradingRationale =
    typeof record.gradingRationale === "string" ? record.gradingRationale : undefined
  const needsManualReview =
    typeof record.needsManualReview === "boolean" ? record.needsManualReview : undefined

  return { selectedOptionIds, openText, gradingRationale, needsManualReview }
}

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

function formatOptionTexts(
  options: Array<{ id: string; text: string }>,
  optionIds: string[]
): string {
  const texts = optionIds
    .map((id) => options.find((option) => option.id === id)?.text)
    .filter((text): text is string => Boolean(text))

  return texts.length > 0 ? texts.join(", ") : "—"
}

function buildAttemptFeedbackInput(
  scoredAnswers: Array<{
    question: QuestionScoringRow
    employeeAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
): AttemptFeedbackAnswerInput[] {
  return scoredAnswers.map((item) => ({
    questionText: item.question.question_text,
    topic: item.question.topic ?? "General",
    isCorrect: item.isCorrect,
    employeeAnswer: item.employeeAnswer,
    correctAnswer: item.correctAnswer,
    explanation: item.question.explanation ?? "",
  }))
}

function resolveAttemptAiFeedback(
  storedFeedback: string | null | undefined,
  testTitle: string,
  score: number,
  passed: boolean,
  answerReview: EmployeeTestResult["answerReview"]
): EmployeeTestResult["aiFeedback"] {
  const parsed = parseAttemptFeedbackEnvelope(storedFeedback)

  if (parsed) {
    return parsed
  }

  return buildDynamicAiFeedback(testTitle, score, passed, answerReview)
}

async function persistAttemptFeedbackBestEffort(
  attemptId: string,
  input: Parameters<typeof generateAttemptFeedbackBestEffort>[0]
): Promise<void> {
  const feedback = await generateAttemptFeedbackBestEffort(input)

  if (!feedback) {
    return
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("test_attempts")
    .update({ ai_feedback: serializeAttemptFeedbackEnvelope(feedback) })
    .eq("id", attemptId)

  if (error) {
    console.warn("Failed to persist attempt feedback:", error.message)
  }
}

function buildDynamicAiFeedback(
  testTitle: string,
  score: number,
  passed: boolean,
  answerReview: EmployeeTestResult["answerReview"]
): EmployeeTestResult["aiFeedback"] {
  const correctItems = answerReview.filter((item) => item.isCorrect)
  const incorrectItems = answerReview.filter((item) => !item.isCorrect)
  const understoodTopics = [...new Set(correctItems.map((item) => item.topic))].slice(0, 2)
  const weakTopicNames = [...new Set(incorrectItems.map((item) => item.topic))]

  return {
    performanceSummary: passed
      ? `You scored ${score}% and passed the ${testTitle}.`
      : `You scored ${score}% and did not meet the passing threshold on the ${testTitle}.`,
    understoodWell:
      correctItems.length > 0
        ? `You answered ${correctItems.length} question${correctItems.length === 1 ? "" : "s"} correctly${understoodTopics.length > 0 ? `, including topics like ${understoodTopics.join(" and ")}` : ""}.`
        : "Focus on reviewing the source document sections linked to each question.",
    needsImprovement:
      incorrectItems.length > 0
        ? `You missed ${incorrectItems.length} question${incorrectItems.length === 1 ? "" : "s"}${weakTopicNames.length > 0 ? `, especially in ${weakTopicNames.join(" and ")}` : ""}.`
        : "No incorrect answers in this attempt.",
    recommendedNextStep:
      incorrectItems.length > 0
        ? "Review your incorrect answers below and use Check Understanding on any weak topics."
        : "Great work — revisit the source document periodically to keep knowledge fresh.",
  }
}

function buildWeakTopicsFromReview(
  answerReview: EmployeeTestResult["answerReview"]
): EmployeeTestResult["weakTopics"] {
  const incorrectByTopic = new Map<string, EmployeeTestResult["answerReview"]>()

  for (const item of answerReview) {
    if (item.isCorrect) continue
    const existing = incorrectByTopic.get(item.topic) ?? []
    existing.push(item)
    incorrectByTopic.set(item.topic, existing)
  }

  return Array.from(incorrectByTopic.entries()).map(([topic, items]) => ({
    topic,
    missedQuestionsCount: items.length,
    explanation: items[0]?.explanation ?? `Review the ${topic} section in the source document.`,
    recommendedAction: `Review the ${topic} section and try a follow-up question if available.`,
  }))
}

async function getActiveAttempt(userId: string, testId: string): Promise<AttemptRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select(
      "id, organization_id, test_id, user_id, assignment_id, status, score, passed, ai_feedback, started_at, completed_at"
    )
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch active attempt: ${error.message}`)
  }

  return data as AttemptRow | null
}

async function getCompletedAttemptCount(input: {
  userId: string
  testId: string
  organizationId: string
}): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from("test_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("test_id", input.testId)
    .eq("organization_id", input.organizationId)
    .eq("status", "completed")

  if (error) {
    throw new Error(`Failed to count completed attempts: ${error.message}`)
  }

  return count ?? 0
}

async function getAttemptById(attemptId: string): Promise<AttemptRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select(
      "id, organization_id, test_id, user_id, assignment_id, status, score, passed, ai_feedback, started_at, completed_at"
    )
    .eq("id", attemptId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch attempt: ${error.message}`)
  }

  return data as AttemptRow | null
}

async function getTestAttemptPolicyRow(input: {
  testId: string
  organizationId: string
}): Promise<TestAttemptPolicyRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select(TEST_ATTEMPT_POLICY_SELECT)
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error && isMissingMaxAttemptsColumnError(error)) {
    warnMissingMaxAttemptsFallback()

    const { data: legacyData, error: legacyError } = await supabase
      .from("tests")
      .select(LEGACY_TEST_ATTEMPT_POLICY_SELECT)
      .eq("id", input.testId)
      .eq("organization_id", input.organizationId)
      .maybeSingle()

    if (legacyError) {
      throw new Error(`Failed to fetch test: ${legacyError.message}`)
    }

    return normalizeTestAttemptPolicyRow(legacyData)
  }

  if (error) {
    throw new Error(`Failed to fetch test: ${error.message}`)
  }

  return normalizeTestAttemptPolicyRow(data)
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

export type StartAttemptErrorCode =
  | "not_found"
  | "assignment_finished"
  | "test_inactive"
  | "max_attempts_reached"

export class StartAttemptError extends Error {
  constructor(
    message: string,
    public code: StartAttemptErrorCode
  ) {
    super(message)
    this.name = "StartAttemptError"
  }
}

export async function startEmployeeTestAttempt(
  testId: string,
  userId: string,
  organizationId: string
): Promise<StartAttemptResult | null> {
  const assignment = await getAssignmentForEmployee(testId, userId, organizationId)
  if (!assignment) return null

  if (assignment.status === "completed") {
    throw new StartAttemptError("Passed assignments cannot be retaken", "assignment_finished")
  }

  if (!isAssignmentTakeable(assignment.status) && assignment.status !== "failed") {
    return null
  }

  const supabase = createAdminClient()
  const testRow = await getTestAttemptPolicyRow({ testId, organizationId })
  if (!testRow || testRow.status !== "published") return null

  const isActive = testRow.is_active ?? true
  const sourceValidity = testRow.source_validity ?? "valid"

  if (
    !isTestAssignable({
      status: testRow.status,
      isActive,
      sourceValidity,
    })
  ) {
    throw new StartAttemptError(INACTIVE_TEST_START_MESSAGE, "test_inactive")
  }

  const existingAttempt = await getActiveAttempt(userId, testId)
  if (existingAttempt) {
    return { attemptId: existingAttempt.id, testId }
  }

  if (assignment.status === "failed") {
    const completedAttemptCount = await getCompletedAttemptCount({
      userId,
      testId,
      organizationId,
    })
    const maxAttempts = testRow.max_attempts ?? 3

    if (completedAttemptCount >= maxAttempts) {
      throw new StartAttemptError(
        `Maximum attempts reached (${maxAttempts}). Review your latest result instead.`,
        "max_attempts_reached"
      )
    }
  }

  if (assignment.status === "not_started" || assignment.status === "failed") {
    const { data: updatedAssignment, error: assignmentUpdateError } = await supabase
      .from("test_assignments")
      .update({ status: "in_progress" })
      .eq("id", assignment.id)
      .in("status", ["not_started", "failed"])
      .select("id")
      .maybeSingle()

    if (assignmentUpdateError) {
      throw new Error(`Failed to update assignment status: ${assignmentUpdateError.message}`)
    }

    if (!updatedAssignment) {
      const latestAssignment = await getAssignmentForEmployee(testId, userId, organizationId)

      if (!latestAssignment) {
        return null
      }

      if (latestAssignment.status === "completed") {
        throw new StartAttemptError("Passed assignments cannot be retaken", "assignment_finished")
      }

      if (!isAssignmentTakeable(latestAssignment.status) && latestAssignment.status !== "failed") {
        return null
      }
    }
  }

  const now = new Date().toISOString()

  const { data: newAttempt, error: insertError } = await supabase
    .from("test_attempts")
    .insert({
      organization_id: testRow.organization_id,
      test_id: testId,
      user_id: userId,
      assignment_id: assignment.id,
      status: "in_progress",
      started_at: now,
    })
    .select("id")
    .single()

  if (insertError) {
    const racedAttempt = await getActiveAttempt(userId, testId)
    if (racedAttempt) {
      return { attemptId: racedAttempt.id, testId }
    }

    throw new Error(`Failed to create test attempt: ${insertError.message}`)
  }

  return { attemptId: newAttempt.id, testId }
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

  const scoredAnswers = []

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

  const { data: completedAttemptRows, error: completeAttemptError } = await supabase.rpc(
    "complete_test_attempt",
    {
      p_attempt_id: attempt.id,
      p_test_id: input.testId,
      p_user_id: userId,
      p_organization_id: organizationId,
      p_score: score,
      p_passed: passed,
      p_completed_at: now,
      p_answers: answerPayload as unknown as Json,
    }
  )

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
      answerReview
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
