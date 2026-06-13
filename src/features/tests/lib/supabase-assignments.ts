import "server-only"

import type { DocumentStatus } from "@/data/mock/documents"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import type {
  TestAssignmentsSummary,
  TestDifficulty,
  TestLanguage,
  TestStatus,
} from "@/features/tests/mock/tests"
import type {
  MockEmployee,
  TestAssignmentStatus,
  TestEmployeeAssignment,
} from "@/features/tests/mock/employees"
import { createAdminClient } from "@/lib/supabase/admin"

type TestRow = {
  id: string
  organization_id: string
  source_document_id: string | null
  title: string
  description: string | null
  status: string
  difficulty: string
  language: string
  target_role: string | null
  question_count: number | null
  passing_score: number
  published_at: string | null
  created_at: string
  is_active: boolean
  source_validity: string
  source_invalid_reason: string | null
}

type DocumentRow = {
  id: string
  title: string
  status: string
}

type OrganizationMemberRow = {
  user_id: string | null
  department: string | null
  job_title: string | null
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
}

type AssignmentRow = {
  id: string
  user_id: string
  status: string
  deadline: string | null
}

export type SupabaseAssignmentSummary = TestAssignmentsSummary & {
  failed: number
}

export type SupabaseAssignedEmployee = {
  assignmentId: string
  userId: string
  name: string
  email: string
  status: TestAssignmentStatus
  deadline: string | null
}

export type SupabaseAssignPageData = {
  test: ResolvedMockTest
  employees: MockEmployee[]
  assignments: TestEmployeeAssignment[]
  assignmentSummary: SupabaseAssignmentSummary
}

export type CreatedAssignment = {
  id: string
  userId: string
  status: TestAssignmentStatus
  deadline: string | null
}

export type SkippedAssignment = {
  userId: string
  reason: "already_assigned"
}

export type CreateAssignmentsResult = {
  test: {
    id: string
    title: string
    status: string
    organizationId: string
    isActive: boolean
    sourceValidity: string
  }
  invalidUserIds: string[]
  created: CreatedAssignment[]
  skipped: SkippedAssignment[]
}

function isAssignmentStatus(status: string): status is TestAssignmentStatus {
  return (
    status === "not_started" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "failed"
  )
}

function mapAssignmentStatus(status: string): TestAssignmentStatus {
  return isAssignmentStatus(status) ? status : "not_started"
}

function mapTestStatus(status: string): TestStatus {
  if (status === "published" || status === "archived") {
    return status
  }

  return "draft"
}

function mapDifficulty(difficulty: string): TestDifficulty {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    return difficulty
  }

  return "medium"
}

function mapLanguage(language: string): TestLanguage {
  return language === "de" ? "German" : "English"
}

function mapDocumentStatus(status: string): DocumentStatus {
  if (
    status === "ready" ||
    status === "processing" ||
    status === "failed" ||
    status === "uploaded" ||
    status === "archived" ||
    status === "deleted"
  ) {
    return status
  }

  return "ready"
}

function emptyAssignmentSummary(): SupabaseAssignmentSummary {
  return {
    assigned: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    failed: 0,
  }
}

function summarizeAssignments(assignments: AssignmentRow[]): SupabaseAssignmentSummary {
  const summary = emptyAssignmentSummary()

  for (const assignment of assignments) {
    summary.assigned += 1

    switch (mapAssignmentStatus(assignment.status)) {
      case "completed":
        summary.completed += 1
        break
      case "in_progress":
        summary.inProgress += 1
        break
      case "failed":
        summary.failed += 1
        break
      case "not_started":
        summary.notStarted += 1
        break
    }
  }

  return summary
}

function profileDisplayName(profile: ProfileRow | undefined, fallback: string): string {
  return profile?.full_name ?? profile?.email ?? fallback
}

function mapTestRowToResolvedTest(
  test: TestRow,
  sourceDocument: DocumentRow | null,
  assignmentSummary: SupabaseAssignmentSummary
): ResolvedMockTest {
  const sourceDocumentId = test.source_document_id ?? "unknown"

  return {
    id: test.id,
    title: test.title,
    description: test.description ?? "",
    status: mapTestStatus(test.status),
    difficulty: mapDifficulty(test.difficulty),
    targetRole: test.target_role ?? "All employees",
    language: mapLanguage(test.language),
    questionCount: test.question_count ?? 0,
    passingScore: test.passing_score,
    selectedTopics: [],
    selectedChunksCount: 0,
    createdAt: (test.published_at ?? test.created_at).slice(0, 10),
    assignedEmployeesCount: assignmentSummary.assigned,
    attemptsCount: 0,
    isActive: test.is_active ?? true,
    sourceValidity: test.source_validity ?? "valid",
    sourceInvalidReason: test.source_invalid_reason,
    sourceDocument: {
      documentId: sourceDocumentId,
      topicsUsed: [],
      chunksUsed: 0,
      title: sourceDocument?.title ?? "Unknown document",
      status: mapDocumentStatus(sourceDocument?.status ?? "ready"),
    },
    questions: [],
    assignments: assignmentSummary,
    results: {
      averageScore: 0,
      passRate: 0,
      weakTopics: [],
      recentAttempts: [],
    },
  }
}

async function getTestRowById(testId: string): Promise<TestRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select(
      "id, organization_id, source_document_id, title, description, status, difficulty, language, target_role, question_count, passing_score, published_at, created_at, is_active, source_validity, source_invalid_reason"
    )
    .eq("id", testId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch test: ${error.message}`)
  }

  return data as TestRow | null
}

async function getSourceDocument(documentId: string | null): Promise<DocumentRow | null> {
  if (!documentId) return null

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, status")
    .eq("id", documentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch source document: ${error.message}`)
  }

  return data as DocumentRow | null
}

async function getAssignmentsForTest(testId: string): Promise<AssignmentRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_assignments")
    .select("id, user_id, status, deadline")
    .eq("test_id", testId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch assignments: ${error.message}`)
  }

  return (data ?? []) as AssignmentRow[]
}

async function getProfilesById(userIds: string[]): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) return new Map()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
}

async function getActiveEmployeeMembers(
  organizationId: string,
  userIds?: string[]
): Promise<OrganizationMemberRow[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from("organization_members")
    .select("user_id, department, job_title")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .eq("status", "active")
    .not("user_id", "is", null)

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch organization members: ${error.message}`)
  }

  return (data ?? []) as OrganizationMemberRow[]
}

function mapMemberToEmployee(
  member: OrganizationMemberRow,
  profile: ProfileRow | undefined
): MockEmployee | null {
  if (!member.user_id) return null

  return {
    id: member.user_id,
    name: profileDisplayName(profile, "Employee"),
    email: profile?.email ?? "No email",
    role: member.job_title ?? "Employee",
    department: member.department ?? "Unassigned",
    completedTestsCount: 0,
    averageScore: 0,
    riskLevel: "on_track",
  }
}

export async function getSupabaseAssignPageData(
  testId: string
): Promise<SupabaseAssignPageData | null> {
  const test = await getTestRowById(testId)

  if (!test) {
    return null
  }

  const [sourceDocument, assignments, members] = await Promise.all([
    getSourceDocument(test.source_document_id),
    getAssignmentsForTest(test.id),
    getActiveEmployeeMembers(test.organization_id),
  ])
  const assignmentSummary = summarizeAssignments(assignments)
  const profilesById = await getProfilesById(
    members.map((member) => member.user_id).filter((userId): userId is string => Boolean(userId))
  )

  return {
    test: mapTestRowToResolvedTest(test, sourceDocument, assignmentSummary),
    employees: members
      .map((member) =>
        mapMemberToEmployee(member, member.user_id ? profilesById.get(member.user_id) : undefined)
      )
      .filter((employee): employee is MockEmployee => employee !== null),
    assignments: assignments.map((assignment) => ({
      testId: test.id,
      employeeId: assignment.user_id,
      status: mapAssignmentStatus(assignment.status),
    })),
    assignmentSummary,
  }
}

export async function getSupabaseAssignmentSummaryByTestId(testId: string): Promise<{
  summary: SupabaseAssignmentSummary
  employees: SupabaseAssignedEmployee[]
}> {
  const assignments = await getAssignmentsForTest(testId)
  const profilesById = await getProfilesById(assignments.map((assignment) => assignment.user_id))

  return {
    summary: summarizeAssignments(assignments),
    employees: assignments.map((assignment) => {
      const profile = profilesById.get(assignment.user_id)

      return {
        assignmentId: assignment.id,
        userId: assignment.user_id,
        name: profileDisplayName(profile, "Employee"),
        email: profile?.email ?? "No email",
        status: mapAssignmentStatus(assignment.status),
        deadline: assignment.deadline,
      }
    }),
  }
}

export async function createSupabaseTestAssignments({
  testId,
  userIds,
  deadline,
}: {
  testId: string
  userIds: string[]
  deadline: string | null
}): Promise<CreateAssignmentsResult | null> {
  const test = await getTestRowById(testId)

  if (!test) {
    return null
  }

  if (test.status !== "published") {
    return {
      test: {
        id: test.id,
        title: test.title,
        status: test.status,
        organizationId: test.organization_id,
        isActive: test.is_active ?? true,
        sourceValidity: test.source_validity ?? "valid",
      },
      invalidUserIds: [],
      created: [],
      skipped: [],
    }
  }

  const uniqueUserIds = Array.from(new Set(userIds))
  const [validMembers, existingAssignments] = await Promise.all([
    getActiveEmployeeMembers(test.organization_id, uniqueUserIds),
    getAssignmentsForTest(test.id),
  ])
  const validUserIds = new Set(
    validMembers
      .map((member) => member.user_id)
      .filter((userId): userId is string => Boolean(userId))
  )
  const existingUserIds = new Set(existingAssignments.map((assignment) => assignment.user_id))
  const invalidUserIds = uniqueUserIds.filter((userId) => !validUserIds.has(userId))
  const insertUserIds = uniqueUserIds.filter(
    (userId) => validUserIds.has(userId) && !existingUserIds.has(userId)
  )
  const skipped: SkippedAssignment[] = uniqueUserIds
    .filter((userId) => existingUserIds.has(userId))
    .map((userId) => ({ userId, reason: "already_assigned" }))

  if (invalidUserIds.length > 0) {
    return {
      test: {
        id: test.id,
        title: test.title,
        status: test.status,
        organizationId: test.organization_id,
        isActive: test.is_active ?? true,
        sourceValidity: test.source_validity ?? "valid",
      },
      invalidUserIds,
      created: [],
      skipped,
    }
  }

  let created: CreatedAssignment[] = []

  if (insertUserIds.length > 0) {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("test_assignments")
      .upsert(
        insertUserIds.map((userId) => ({
          organization_id: test.organization_id,
          test_id: test.id,
          user_id: userId,
          assigned_by: null,
          status: "not_started",
          deadline,
        })),
        { onConflict: "test_id,user_id", ignoreDuplicates: true }
      )
      .select("id, user_id, status, deadline")

    if (error) {
      throw new Error(`Failed to create assignments: ${error.message}`)
    }

    created = ((data ?? []) as AssignmentRow[]).map((assignment) => ({
      id: assignment.id,
      userId: assignment.user_id,
      status: mapAssignmentStatus(assignment.status),
      deadline: assignment.deadline,
    }))

    const createdUserIds = new Set(created.map((assignment) => assignment.userId))
    for (const userId of insertUserIds) {
      if (!createdUserIds.has(userId)) {
        skipped.push({ userId, reason: "already_assigned" })
      }
    }
  }

  return {
    test: {
      id: test.id,
      title: test.title,
      status: test.status,
      organizationId: test.organization_id,
      isActive: test.is_active ?? true,
      sourceValidity: test.source_validity ?? "valid",
    },
    invalidUserIds,
    created,
    skipped,
  }
}
