import "server-only"

import type { SupabaseEmployeeTakeableTest } from "@/features/employee/tests/lib/test-taking-state"
import type { TestAssignmentStatus } from "@/features/tests/types/assignment"
import type { TestDifficulty } from "@/features/tests/types/test"
import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"
import { parseOptions } from "@/shared/db/parse-json-fields"
import {
  isMissingMaxAttemptsColumnError,
  warnMissingMaxAttemptsFallback,
} from "./supabase-schema-drift"

export type EmployeeSafeQuestionOption = {
  id: string
  text: string
}

export type EmployeeSafeQuestion = {
  id: string
  questionText: string
  questionType: "single_choice" | "multiple_choice" | "true_false" | "open_question"
  options: EmployeeSafeQuestionOption[]
  topic: string
  sourceChunkReference: string
}

type AssignmentRow = {
  id: string
  test_id: string
  status: string
  deadline: string | null
}

type TestRow = {
  id: string
  organization_id: string
  source_document_id: string | null
  title: string
  description: string | null
  difficulty: string
  question_count: number | null
  passing_score: number
  max_attempts: number | null
  status: string
  is_active: boolean
  source_validity: string
}

type QuestionRow = {
  id: string
  question_text: string
  question_type: string
  options: Json
  topic: string | null
  order_index: number
  source_chunk_id: string | null
}

const TEST_SELECT =
  "id, organization_id, source_document_id, title, description, difficulty, question_count, passing_score, max_attempts, status, is_active, source_validity"

const LEGACY_TEST_SELECT =
  "id, organization_id, source_document_id, title, description, difficulty, question_count, passing_score, status, is_active, source_validity"

function normalizeTestRow(row: unknown | null): TestRow | null {
  if (!row) return null

  const test = row as Partial<TestRow>

  return {
    ...test,
    max_attempts: test.max_attempts ?? null,
  } as TestRow
}

function mapAssignmentStatus(status: string): TestAssignmentStatus {
  if (
    status === "not_started" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status
  }

  return "not_started"
}

function mapDifficulty(difficulty: string): TestDifficulty {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    return difficulty
  }

  return "medium"
}

function mapQuestionType(questionType: string): EmployeeSafeQuestion["questionType"] {
  if (
    questionType === "single_choice" ||
    questionType === "multiple_choice" ||
    questionType === "true_false" ||
    questionType === "open_question"
  ) {
    return questionType
  }

  return "single_choice"
}

function getEstimatedMinutes(questionCount: number): number {
  return Math.max(5, questionCount * 2)
}

function getProgressPercent(status: TestAssignmentStatus): number {
  if (status === "completed" || status === "failed") return 100
  if (status === "in_progress") return 25
  return 0
}

export function isAssignmentTakeable(status: string): boolean {
  return status === "not_started" || status === "in_progress"
}

export function isAssignmentFinished(status: string): boolean {
  return status === "completed" || status === "failed"
}

async function getAssignmentForUserAndTest(
  userId: string,
  testId: string,
  organizationId: string
): Promise<AssignmentRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_assignments")
    .select("id, test_id, status, deadline")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch assignment: ${error.message}`)
  }

  return data as AssignmentRow | null
}

async function getTestRow(testId: string): Promise<TestRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select(TEST_SELECT)
    .eq("id", testId)
    .maybeSingle()

  if (error && isMissingMaxAttemptsColumnError(error)) {
    warnMissingMaxAttemptsFallback()

    const { data: legacyData, error: legacyError } = await supabase
      .from("tests")
      .select(LEGACY_TEST_SELECT)
      .eq("id", testId)
      .maybeSingle()

    if (legacyError) {
      throw new Error(`Failed to fetch test: ${legacyError.message}`)
    }

    return normalizeTestRow(legacyData)
  } else if (error) {
    throw new Error(`Failed to fetch test: ${error.message}`)
  }

  return normalizeTestRow(data)
}

async function getSourceDocumentTitle(documentId: string | null): Promise<string> {
  if (!documentId) return "Unknown document"

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch source document: ${error.message}`)
  }

  return data?.title ?? "Unknown document"
}

async function getSafeQuestionsForTest(testId: string): Promise<EmployeeSafeQuestion[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_questions")
    .select("id, question_text, question_type, options, topic, order_index, source_chunk_id")
    .eq("test_id", testId)
    .order("order_index", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch test questions: ${error.message}`)
  }

  return ((data ?? []) as QuestionRow[]).map((question) => ({
    id: question.id,
    questionText: question.question_text,
    questionType: mapQuestionType(question.question_type),
    options: parseOptions(question.options),
    topic: question.topic ?? "General",
    sourceChunkReference: question.source_chunk_id
      ? `Chunk (${question.source_chunk_id.slice(0, 8)}…)`
      : "Source document",
  }))
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

export async function getSupabaseEmployeeTakeableTest(
  testId: string,
  userId: string,
  organizationId: string
): Promise<SupabaseEmployeeTakeableTest | null> {
  const assignment = await getAssignmentForUserAndTest(userId, testId, organizationId)
  if (!assignment || assignment.status === "completed") {
    return null
  }

  const test = await getTestRow(testId)
  if (!test || test.status !== "published" || test.organization_id !== organizationId) return null

  if (assignment.status === "failed") {
    const completedAttemptCount = await getCompletedAttemptCount({
      userId,
      testId,
      organizationId,
    })

    if (completedAttemptCount >= (test.max_attempts ?? 3)) {
      return null
    }
  } else if (!isAssignmentTakeable(assignment.status)) {
    return null
  }

  if (
    !isTestAssignable({
      status: test.status,
      isActive: test.is_active ?? true,
      sourceValidity: test.source_validity ?? "valid",
    })
  ) {
    return null
  }

  const questions = await getSafeQuestionsForTest(testId)
  if (questions.length === 0) return null

  const sourceDocument = await getSourceDocumentTitle(test.source_document_id)
  const status =
    assignment.status === "failed" ? "in_progress" : mapAssignmentStatus(assignment.status)
  const questionCount = test.question_count ?? questions.length

  return {
    source: "supabase",
    assignmentId: assignment.id,
    id: test.id,
    title: test.title,
    description: test.description ?? "",
    status,
    sourceDocument,
    difficulty: mapDifficulty(test.difficulty),
    questionCount,
    passingScore: test.passing_score,
    deadline: assignment.deadline,
    estimatedMinutes: getEstimatedMinutes(questionCount),
    score: null,
    passed: null,
    required: true,
    progressPercent: getProgressPercent(status),
    questions,
  }
}

export async function getAssignmentForEmployee(
  testId: string,
  userId: string,
  organizationId: string
): Promise<(AssignmentRow & { organization_id: string }) | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_assignments")
    .select("id, test_id, status, deadline, organization_id")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch assignment: ${error.message}`)
  }

  return data as (AssignmentRow & { organization_id: string }) | null
}
