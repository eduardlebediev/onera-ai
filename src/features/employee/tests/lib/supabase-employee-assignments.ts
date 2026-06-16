import "server-only"

import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"
import type { TestAssignmentStatus, AssignableEmployee } from "@/features/tests/types/assignment"
import type { TestDifficulty } from "@/features/tests/types/test"
import { createAdminClient } from "@/lib/supabase/admin"

import { getEmployeeCompletedAttemptStats } from "./supabase-employee-progress"
import {
  isMissingMaxAttemptsColumnError,
  warnMissingMaxAttemptsFallback,
} from "./supabase-schema-drift"

type AssignmentRow = {
  id: string
  test_id: string
  status: string
  deadline: string | null
  created_at: string
}

type TestRow = {
  id: string
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
  source_invalid_reason: string | null
}

type DocumentRow = {
  id: string
  title: string
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
}

type MemberRow = {
  user_id: string | null
  department: string | null
  job_title: string | null
}

export type SupabaseEmployeeAssignmentsResult = {
  employee: AssignableEmployee | null
  tests: EmployeeAssignedTest[]
}

const TEST_SELECT =
  "id, source_document_id, title, description, difficulty, question_count, passing_score, max_attempts, status, is_active, source_validity, source_invalid_reason"

const LEGACY_TEST_SELECT =
  "id, source_document_id, title, description, difficulty, question_count, passing_score, status, is_active, source_validity, source_invalid_reason"

function normalizeTestRows(rows: unknown[] | null): TestRow[] {
  return (rows ?? []).map((row) => {
    const test = row as Partial<TestRow>

    return {
      ...test,
      max_attempts: test.max_attempts ?? null,
    } as TestRow
  })
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

function getEstimatedMinutes(questionCount: number): number {
  return Math.max(5, questionCount * 2)
}

function getProgressPercent(status: TestAssignmentStatus): number {
  if (status === "completed" || status === "failed") return 100
  if (status === "in_progress") return 25
  return 0
}

async function getEmployeeProfile(userId: string): Promise<AssignableEmployee | null> {
  const supabase = createAdminClient()

  const [{ data: profile, error: profileError }, { data: member, error: memberError }] =
    await Promise.all([
      supabase.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
      supabase
        .from("organization_members")
        .select("user_id, department, job_title")
        .eq("user_id", userId)
        .eq("role", "employee")
        .eq("status", "active")
        .maybeSingle(),
    ])

  if (profileError) {
    throw new Error(`Failed to fetch employee profile: ${profileError.message}`)
  }

  if (memberError) {
    throw new Error(`Failed to fetch employee membership: ${memberError.message}`)
  }

  const profileRow = profile as ProfileRow | null
  const memberRow = member as MemberRow | null

  if (!profileRow || !memberRow) {
    return null
  }

  return {
    id: profileRow.id,
    name: profileRow.full_name ?? profileRow.email ?? "Demo Employee",
    email: profileRow.email ?? "No email",
    role: memberRow.job_title ?? "Employee",
    department: memberRow.department ?? "Unassigned",
    completedTestsCount: 0,
    averageScore: 0,
    riskLevel: "on_track",
  }
}

async function getAssignmentRows(userId: string, organizationId: string): Promise<AssignmentRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_assignments")
    .select("id, test_id, status, deadline, created_at")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch employee assignments: ${error.message}`)
  }

  return (data ?? []) as AssignmentRow[]
}

async function getTestsById(testIds: string[]): Promise<Map<string, TestRow>> {
  if (testIds.length === 0) return new Map()

  const supabase = createAdminClient()

  const { data, error } = await supabase.from("tests").select(TEST_SELECT).in("id", testIds)

  if (error && isMissingMaxAttemptsColumnError(error)) {
    warnMissingMaxAttemptsFallback()

    const { data: legacyData, error: legacyError } = await supabase
      .from("tests")
      .select(LEGACY_TEST_SELECT)
      .in("id", testIds)

    if (legacyError) {
      throw new Error(`Failed to fetch assigned tests: ${legacyError.message}`)
    }

    return new Map(normalizeTestRows(legacyData as unknown[] | null).map((test) => [test.id, test]))
  } else if (error) {
    throw new Error(`Failed to fetch assigned tests: ${error.message}`)
  }

  return new Map(normalizeTestRows(data as unknown[] | null).map((test) => [test.id, test]))
}

async function getDocumentsById(documentIds: string[]): Promise<Map<string, DocumentRow>> {
  if (documentIds.length === 0) return new Map()

  const supabase = createAdminClient()

  const { data, error } = await supabase.from("documents").select("id, title").in("id", documentIds)

  if (error) {
    throw new Error(`Failed to fetch assignment source documents: ${error.message}`)
  }

  return new Map(((data ?? []) as DocumentRow[]).map((document) => [document.id, document]))
}

async function getCompletedAttemptRows(input: {
  userId: string
  testId: string
  organizationId: string
}): Promise<Array<{ id: string; score: number | null; passed: boolean | null }>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, score, passed")
    .eq("user_id", input.userId)
    .eq("test_id", input.testId)
    .eq("organization_id", input.organizationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch completed attempts: ${error.message}`)
  }

  return (data ?? []) as Array<{ id: string; score: number | null; passed: boolean | null }>
}

export async function getSupabaseEmployeeAssignments(
  userId: string,
  organizationId: string
): Promise<SupabaseEmployeeAssignmentsResult> {
  const [employee, assignments, attemptStats] = await Promise.all([
    getEmployeeProfile(userId),
    getAssignmentRows(userId, organizationId),
    getEmployeeCompletedAttemptStats(userId, organizationId),
  ])
  const employeeWithStats = employee
    ? {
        ...employee,
        completedTestsCount: attemptStats.completedTestsCount,
        averageScore: attemptStats.averageScore,
      }
    : null

  if (assignments.length === 0) {
    return { employee: employeeWithStats, tests: [] }
  }

  const testsById = await getTestsById(Array.from(new Set(assignments.map((item) => item.test_id))))
  const documentIds = Array.from(
    new Set(
      Array.from(testsById.values())
        .map((test) => test.source_document_id)
        .filter((documentId): documentId is string => Boolean(documentId))
    )
  )
  const documentsById = await getDocumentsById(documentIds)

  const testsWithAttempts = await Promise.all(
    assignments
      .flatMap((assignment) => {
        const test = testsById.get(assignment.test_id)
        if (!test) return []

        return [{ assignment, test }]
      })
      .map(async ({ assignment, test }) => {
        const status = mapAssignmentStatus(assignment.status)
        const questionCount = test.question_count ?? 0
        const sourceDocument = test.source_document_id
          ? documentsById.get(test.source_document_id)
          : null

        let score: number | null = null
        let passed: boolean | null = null
        let latestAttemptId: string | undefined
        let attemptCount = 0

        if (status === "completed" || status === "failed") {
          const completedAttempts = await getCompletedAttemptRows({
            userId,
            testId: test.id,
            organizationId,
          })
          const latestAttempt = completedAttempts[0]
          attemptCount = completedAttempts.length

          if (latestAttempt) {
            score = latestAttempt.score
            passed = latestAttempt.passed
            latestAttemptId = latestAttempt.id
          }
        }

        const testIsActive = test.is_active ?? true
        const sourceValidity = test.source_validity ?? "valid"
        const maxAttempts = test.max_attempts ?? 3
        const testCanBeTaken = isTestAssignable({
          status: test.status,
          isActive: testIsActive,
          sourceValidity,
        })
        const canRetake =
          status === "failed" && passed === false && attemptCount < maxAttempts && testCanBeTaken

        return {
          assignmentId: assignment.id,
          latestAttemptId,
          id: test.id,
          title: test.title,
          description: test.description ?? "",
          status,
          sourceDocument: sourceDocument?.title ?? "Unknown document",
          difficulty: mapDifficulty(test.difficulty),
          questionCount,
          passingScore: test.passing_score,
          deadline: assignment.deadline,
          estimatedMinutes: getEstimatedMinutes(questionCount),
          score,
          passed,
          attemptCount,
          maxAttempts,
          canRetake,
          required: true,
          progressPercent: getProgressPercent(status),
          testIsActive,
          sourceValidity,
          sourceInvalidReason: test.source_invalid_reason,
        } satisfies EmployeeAssignedTest
      })
  )

  return {
    employee: employeeWithStats,
    tests: testsWithAttempts,
  }
}
