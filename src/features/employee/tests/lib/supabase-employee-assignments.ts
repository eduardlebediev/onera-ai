import "server-only"

import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import type { TestAssignmentStatus, MockEmployee } from "@/features/tests/mock/employees"
import type { TestDifficulty } from "@/features/tests/mock/tests"
import { createAdminClient } from "@/lib/supabase/admin"

import { getLatestCompletedAttemptIdForAssignment } from "./supabase-employee-attempts"

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
  employee: MockEmployee | null
  tests: EmployeeAssignedTest[]
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

async function getEmployeeProfile(userId: string): Promise<MockEmployee | null> {
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

  const { data, error } = await supabase
    .from("tests")
    .select("id, source_document_id, title, description, difficulty, question_count, passing_score")
    .in("id", testIds)

  if (error) {
    throw new Error(`Failed to fetch assigned tests: ${error.message}`)
  }

  return new Map(((data ?? []) as TestRow[]).map((test) => [test.id, test]))
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

export async function getSupabaseEmployeeAssignments(
  userId: string,
  organizationId: string
): Promise<SupabaseEmployeeAssignmentsResult> {
  const [employee, assignments] = await Promise.all([
    getEmployeeProfile(userId),
    getAssignmentRows(userId, organizationId),
  ])

  if (assignments.length === 0) {
    return { employee, tests: [] }
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

        if (status === "completed" || status === "failed") {
          const latestAttempt = await getLatestCompletedAttemptIdForAssignment(
            userId,
            test.id,
            organizationId
          )
          if (latestAttempt) {
            score = latestAttempt.score
            passed = latestAttempt.passed
            latestAttemptId = latestAttempt.attemptId
          }
        }

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
          required: true,
          progressPercent: getProgressPercent(status),
        } satisfies EmployeeAssignedTest
      })
  )

  return {
    employee,
    tests: testsWithAttempts,
  }
}
