import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type DocumentImpactSummary = {
  documentId: string
  affectedTestCount: number
  affectedQuestionCount: number
  activeAssignmentCount: number
  completedAttemptCount: number
  affectedTests: Array<{
    testId: string
    title: string
    status: string
    sourceValidity: string
    affectedQuestionCount: number
    activeAssignmentCount: number
    completedAttemptCount: number
  }>
}

type AffectedTestRow = {
  id: string
  title: string
  status: string
  source_validity: string
}

type AssignmentRow = {
  test_id: string
  status: string
}

type AttemptRow = {
  test_id: string
  status: string
}

type QuestionCountRow = {
  test_id: string
}

const ACTIVE_ASSIGNMENT_STATUSES = new Set(["not_started", "in_progress"])

export async function getDocumentImpactSummary(input: {
  organizationId: string
  documentId: string
}): Promise<DocumentImpactSummary> {
  const supabase = createAdminClient()

  const { data: tests, error: testsError } = await supabase
    .from("tests")
    .select("id, title, status, source_validity")
    .eq("organization_id", input.organizationId)
    .eq("source_document_id", input.documentId)

  if (testsError) {
    throw new Error(`Failed to fetch affected tests: ${testsError.message}`)
  }

  const affectedTests = (tests ?? []) as AffectedTestRow[]
  const testIds = affectedTests.map((test) => test.id)

  const { data: questions, error: questionsError } = await supabase
    .from("test_questions")
    .select("id, test_id")
    .eq("organization_id", input.organizationId)
    .eq("source_document_id", input.documentId)

  if (questionsError) {
    throw new Error(`Failed to fetch affected questions: ${questionsError.message}`)
  }

  const questionRows = (questions ?? []) as QuestionCountRow[]
  const questionsByTestId = new Map<string, number>()

  for (const question of questionRows) {
    questionsByTestId.set(question.test_id, (questionsByTestId.get(question.test_id) ?? 0) + 1)
  }

  const assignmentsByTestId = new Map<string, number>()
  const completedAttemptsByTestId = new Map<string, number>()

  if (testIds.length > 0) {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("test_assignments")
      .select("test_id, status")
      .eq("organization_id", input.organizationId)
      .in("test_id", testIds)

    if (assignmentsError) {
      throw new Error(`Failed to fetch affected assignments: ${assignmentsError.message}`)
    }

    for (const assignment of (assignments ?? []) as AssignmentRow[]) {
      if (!ACTIVE_ASSIGNMENT_STATUSES.has(assignment.status)) {
        continue
      }

      assignmentsByTestId.set(
        assignment.test_id,
        (assignmentsByTestId.get(assignment.test_id) ?? 0) + 1
      )
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("test_attempts")
      .select("test_id, status")
      .eq("organization_id", input.organizationId)
      .in("test_id", testIds)

    if (attemptsError) {
      throw new Error(`Failed to fetch affected attempts: ${attemptsError.message}`)
    }

    for (const attempt of (attempts ?? []) as AttemptRow[]) {
      if (attempt.status !== "completed") {
        continue
      }

      completedAttemptsByTestId.set(
        attempt.test_id,
        (completedAttemptsByTestId.get(attempt.test_id) ?? 0) + 1
      )
    }
  }

  const affectedTestSummaries = affectedTests.map((test) => ({
    testId: test.id,
    title: test.title,
    status: test.status,
    sourceValidity: test.source_validity,
    affectedQuestionCount: questionsByTestId.get(test.id) ?? 0,
    activeAssignmentCount: assignmentsByTestId.get(test.id) ?? 0,
    completedAttemptCount: completedAttemptsByTestId.get(test.id) ?? 0,
  }))

  return {
    documentId: input.documentId,
    affectedTestCount: affectedTests.length,
    affectedQuestionCount: questionRows.length,
    activeAssignmentCount: Array.from(assignmentsByTestId.values()).reduce(
      (sum, count) => sum + count,
      0
    ),
    completedAttemptCount: Array.from(completedAttemptsByTestId.values()).reduce(
      (sum, count) => sum + count,
      0
    ),
    affectedTests: affectedTestSummaries,
  }
}
