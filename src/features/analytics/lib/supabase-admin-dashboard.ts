import "server-only"

import type {
  KpiStat,
  DashboardAiDraft,
  DashboardDocument,
  DashboardTest,
  DashboardTestStatus,
  WeeklyCompletion,
} from "@/features/analytics/types/admin-dashboard"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

export type AdminDashboardRecentAttempt = {
  id: string
  employeeName: string
  testTitle: string
  score: number
  passed: boolean
  completedAt: string
}

export type AdminDashboardMetrics = {
  kpiStats: KpiStat[]
  testPerformance: DashboardTest[]
  weeklyCompletions: WeeklyCompletion[]
  recentAttempts: AdminDashboardRecentAttempt[]
}

export type AdminDashboardSupabaseResult = {
  metrics: AdminDashboardMetrics | null
  recentDocuments: DashboardDocument[]
  recentDrafts: DashboardAiDraft[]
}

type TestRow = {
  id: string
  title: string
  status: string
  target_role: string | null
}

type AssignmentRow = {
  id: string
  test_id: string
  user_id: string
  status: string
}

type AttemptRow = {
  id: string
  test_id: string
  user_id: string
  status: string
  score: number | null
  passed: boolean | null
  completed_at: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
}

type WrongAnswerRow = {
  question_id: string
}

type QuestionMetaRow = {
  id: string
  topic: string | null
  test_id: string
}

type RecentDocumentRow = {
  id: string
  title: string
  status: string
  created_at: string
}

type LinkedTestRow = {
  id: string
  source_document_id: string | null
}

type TestDocumentLinkRow = {
  test_id: string
  document_id: string
}

type RecentGenerationRunRow = {
  id: string
  document_id: string | null
  status: string
  model: string | null
  created_at: string
  output_summary: Json
}

type DocumentTitleRow = {
  id: string
  title: string
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

function mapDashboardDocumentStatusToMock(
  status: string
): Pick<DashboardDocument, "status" | "displayStatus"> {
  if (status === "uploaded") {
    return { status: "ready", displayStatus: "uploaded" }
  }

  if (status === "processing") {
    return { status: "processing" }
  }

  if (status === "failed" || status === "deleted") {
    return status === "deleted"
      ? { status: "failed", displayStatus: "deleted" }
      : { status: "failed" }
  }

  if (status === "archived") {
    return { status: "ready", displayStatus: "archived" }
  }

  return { status: "ready" }
}

function mapRecentDocumentRow(
  row: RecentDocumentRow,
  testCountsByDocumentId: Map<string, number>
): DashboardDocument {
  const statusFields = mapDashboardDocumentStatusToMock(row.status)

  return {
    id: row.id,
    title: row.title,
    ...statusFields,
    topics: [],
    testCount: testCountsByDocumentId.get(row.id) ?? 0,
    updatedAt: formatTestDate(row.created_at),
  }
}

function parseQuestionCountFromSummary(summary: Json): number {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return 0
  }

  const questionCount = (summary as Record<string, unknown>).question_count
  return typeof questionCount === "number" && Number.isFinite(questionCount) ? questionCount : 0
}

function hasRecoverableReviewDraft(summary: Json): boolean {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return false
  }

  const reviewDraft = (summary as Record<string, unknown>).review_draft
  if (!reviewDraft || typeof reviewDraft !== "object" || Array.isArray(reviewDraft)) {
    return false
  }

  const draft = (reviewDraft as Record<string, unknown>).draft
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return false
  }

  const questions = (draft as Record<string, unknown>).questions
  return Array.isArray(questions) && questions.length > 0
}

function mapRecentGenerationRunRow(
  row: RecentGenerationRunRow,
  documentTitlesById: Map<string, string>
): DashboardAiDraft {
  const documentTitle = row.document_id ? documentTitlesById.get(row.document_id) : null

  return {
    id: row.id,
    title: documentTitle ?? "Unknown document",
    questionCount: parseQuestionCountFromSummary(row.output_summary),
    documentId: row.document_id ?? undefined,
    status: row.status,
    model: row.model,
    createdAt: row.created_at,
    actionHref: row.document_id ? `/admin/documents/${row.document_id}` : "/admin/tests",
    actionLabel: "View",
  }
}

async function fetchLinkedTestCountsByDocumentId(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  documentIds: string[]
): Promise<Map<string, number>> {
  const testCountsByDocumentId = new Map<string, Set<string>>()

  for (const documentId of documentIds) {
    testCountsByDocumentId.set(documentId, new Set())
  }

  if (documentIds.length === 0) {
    return new Map()
  }

  const [
    { data: sourceTests, error: sourceTestsError },
    { data: testDocumentLinks, error: testDocumentLinksError },
  ] = await Promise.all([
    supabase
      .from("tests")
      .select("id, source_document_id")
      .eq("organization_id", organizationId)
      .in("source_document_id", documentIds),
    supabase
      .from("test_documents")
      .select("test_id, document_id")
      .eq("organization_id", organizationId)
      .in("document_id", documentIds),
  ])

  if (sourceTestsError || testDocumentLinksError) {
    throw new Error(
      sourceTestsError?.message ??
        testDocumentLinksError?.message ??
        "Failed to fetch linked test counts"
    )
  }

  for (const test of (sourceTests ?? []) as LinkedTestRow[]) {
    if (!test.source_document_id) continue
    testCountsByDocumentId.get(test.source_document_id)?.add(test.id)
  }

  for (const link of (testDocumentLinks ?? []) as TestDocumentLinkRow[]) {
    testCountsByDocumentId.get(link.document_id)?.add(link.test_id)
  }

  return new Map(
    Array.from(testCountsByDocumentId.entries()).map(([documentId, testIds]) => [
      documentId,
      testIds.size,
    ])
  )
}

async function fetchRecentDocuments(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<DashboardDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    throw new Error(`Failed to fetch recent documents: ${error.message}`)
  }

  const documentRows = (data ?? []) as RecentDocumentRow[]
  const testCountsByDocumentId = await fetchLinkedTestCountsByDocumentId(
    supabase,
    organizationId,
    documentRows.map((row) => row.id)
  )

  return documentRows.map((row) => mapRecentDocumentRow(row, testCountsByDocumentId))
}

async function fetchRecentDrafts(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<DashboardAiDraft[]> {
  const { data, error } = await supabase
    .from("ai_generation_runs")
    .select("id, document_id, status, model, created_at, output_summary")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    throw new Error(`Failed to fetch recent AI generation runs: ${error.message}`)
  }

  const runRows = (data ?? []) as RecentGenerationRunRow[]
  const draftRunRows = runRows.filter((row) => hasRecoverableReviewDraft(row.output_summary))
  const documentIds = Array.from(
    new Set(draftRunRows.map((row) => row.document_id).filter((id): id is string => Boolean(id)))
  )

  const documentTitlesById = new Map<string, string>()

  if (documentIds.length > 0) {
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id, title")
      .eq("organization_id", organizationId)
      .in("id", documentIds)

    if (documentsError) {
      throw new Error(
        `Failed to fetch AI generation run document titles: ${documentsError.message}`
      )
    }

    for (const document of (documents ?? []) as DocumentTitleRow[]) {
      documentTitlesById.set(document.id, document.title)
    }
  }

  return draftRunRows.map((row) => mapRecentGenerationRunRow(row, documentTitlesById))
}

function mapDashboardTestStatus(status: string): DashboardTestStatus {
  if (status === "published") return "active"
  if (status === "archived") return "archived"
  return "draft"
}

function profileDisplayName(profile: ProfileRow | undefined): string {
  return profile?.full_name ?? profile?.email ?? "Employee"
}

function isAssignmentStatus(
  status: string
): status is "not_started" | "in_progress" | "completed" | "failed" {
  return (
    status === "not_started" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "failed"
  )
}

function buildWeeklyCompletions(attempts: AttemptRow[]): WeeklyCompletion[] {
  const now = new Date()
  const countsByDay = new Map<string, number>()

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setDate(date.getDate() - offset)
    const key = date.toISOString().slice(0, 10)
    countsByDay.set(key, 0)
  }

  for (const attempt of attempts) {
    if (attempt.status !== "completed" || !attempt.completed_at) continue

    const completedDate = attempt.completed_at.slice(0, 10)
    if (countsByDay.has(completedDate)) {
      countsByDay.set(completedDate, (countsByDay.get(completedDate) ?? 0) + 1)
    }
  }

  return Array.from(countsByDay.entries()).map(([dateKey, completions]) => {
    const date = new Date(`${dateKey}T12:00:00`)
    return {
      day: WEEKDAY_LABELS[date.getDay()],
      completions,
    }
  })
}

function buildKpiStats(input: {
  documentsCount: number
  publishedTestsCount: number
  totalAssignments: number
  completedAssignments: number
  inProgressAssignments: number
  averageScore: number | null
  weakTopicsCount: number
  activeEmployeesCount: number
}): KpiStat[] {
  const completionRate =
    input.totalAssignments > 0
      ? Math.round((input.completedAssignments / input.totalAssignments) * 100)
      : 0

  return [
    {
      label: "Documents",
      value: String(input.documentsCount),
      description: "Uploaded source documents",
    },
    {
      label: "Active Tests",
      value: String(input.publishedTestsCount),
      description: "Currently published",
    },
    {
      label: "Assigned Tests",
      value: String(input.totalAssignments),
      description: `${input.inProgressAssignments} in progress · ${completionRate}% completed`,
    },
    {
      label: "Active Employees",
      value: String(input.activeEmployeesCount),
      description: "Completed a test in the last 7 days",
    },
    {
      label: "Average Score",
      value: input.averageScore !== null ? `${Math.round(input.averageScore)}%` : "—",
      description:
        input.averageScore !== null ? "Across completed attempts" : "No completed attempts yet",
    },
    {
      label: "Weak Topics",
      value: String(input.weakTopicsCount),
      description:
        input.weakTopicsCount > 0 ? "Topics with incorrect answers" : "No weak topics yet",
    },
  ]
}

export function buildEmptyAdminDashboardMetrics(): AdminDashboardMetrics {
  return {
    kpiStats: buildKpiStats({
      documentsCount: 0,
      publishedTestsCount: 0,
      totalAssignments: 0,
      completedAssignments: 0,
      inProgressAssignments: 0,
      averageScore: null,
      weakTopicsCount: 0,
      activeEmployeesCount: 0,
    }),
    testPerformance: [],
    weeklyCompletions: buildWeeklyCompletions([]),
    recentAttempts: [],
  }
}

export async function getAdminDashboardFromSupabase(
  organizationId: string
): Promise<AdminDashboardSupabaseResult> {
  if (!organizationId) {
    throw new Error("Admin dashboard requires an organization scope")
  }

  const supabase = createAdminClient()

  let recentDocuments: DashboardDocument[] = []
  let recentDrafts: DashboardAiDraft[] = []

  try {
    recentDocuments = await fetchRecentDocuments(supabase, organizationId)
  } catch (error) {
    console.error("Failed to load recent documents for admin dashboard:", error)
  }

  try {
    recentDrafts = await fetchRecentDrafts(supabase, organizationId)
  } catch (error) {
    console.error("Failed to load recent AI generation runs for admin dashboard:", error)
  }

  try {
    const metrics = await fetchAdminDashboardMetrics(supabase, organizationId)
    return {
      metrics,
      recentDocuments,
      recentDrafts,
    }
  } catch (error) {
    console.error("Failed to load admin dashboard metrics from Supabase:", error)
    return {
      metrics: null,
      recentDocuments,
      recentDrafts,
    }
  }
}

async function fetchAdminDashboardMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<AdminDashboardMetrics | null> {
  const [
    { count: documentsCount, error: documentsError },
    { data: tests, error: testsError },
    { data: assignments, error: assignmentsError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "deleted"),
    supabase
      .from("tests")
      .select("id, title, status, target_role")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("test_assignments")
      .select("id, test_id, user_id, status")
      .eq("organization_id", organizationId),
    supabase
      .from("test_attempts")
      .select("id, test_id, user_id, status, score, passed, completed_at")
      .eq("organization_id", organizationId)
      .order("completed_at", { ascending: false }),
  ])

  if (documentsError || testsError || assignmentsError || attemptsError) {
    throw new Error(
      documentsError?.message ??
        testsError?.message ??
        assignmentsError?.message ??
        attemptsError?.message ??
        "Unknown error"
    )
  }

  const testRows = (tests ?? []) as TestRow[]
  const assignmentRows = (assignments ?? []) as AssignmentRow[]
  const attemptRows = (attempts ?? []) as AttemptRow[]

  if (
    (documentsCount ?? 0) === 0 &&
    testRows.length === 0 &&
    assignmentRows.length === 0 &&
    attemptRows.length === 0
  ) {
    return buildEmptyAdminDashboardMetrics()
  }

  const publishedTests = testRows.filter((test) => test.status === "published")
  const completedAttempts = attemptRows.filter(
    (attempt) =>
      attempt.status === "completed" && attempt.score !== null && attempt.completed_at !== null
  )

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const activeEmployeeIds = new Set(
    completedAttempts
      .filter((attempt) => new Date(attempt.completed_at!) >= sevenDaysAgo)
      .map((attempt) => attempt.user_id)
  )

  const completedAssignments = assignmentRows.filter(
    (assignment) =>
      isAssignmentStatus(assignment.status) &&
      (assignment.status === "completed" || assignment.status === "failed")
  ).length

  const inProgressAssignments = assignmentRows.filter(
    (assignment) => isAssignmentStatus(assignment.status) && assignment.status === "in_progress"
  ).length

  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
        completedAttempts.length
      : null

  const testIds = testRows.map((test) => test.id)
  let weakTopicsCount = 0

  if (testIds.length > 0) {
    const { data: wrongAnswers, error: wrongAnswersError } = await supabase
      .from("test_answers")
      .select("question_id")
      .eq("organization_id", organizationId)
      .eq("is_correct", false)

    if (wrongAnswersError) {
      throw new Error(`Failed to fetch weak topic data: ${wrongAnswersError.message}`)
    }

    const wrongQuestionIds = Array.from(
      new Set(((wrongAnswers ?? []) as WrongAnswerRow[]).map((row) => row.question_id))
    )

    if (wrongQuestionIds.length > 0) {
      const { data: questionMeta, error: questionMetaError } = await supabase
        .from("test_questions")
        .select("id, topic, test_id")
        .eq("organization_id", organizationId)
        .in("id", wrongQuestionIds)
        .in("test_id", testIds)

      if (questionMetaError) {
        throw new Error(`Failed to fetch question topics: ${questionMetaError.message}`)
      }

      const weakTopicKeys = new Set<string>()

      for (const question of (questionMeta ?? []) as QuestionMetaRow[]) {
        const topic = question.topic ?? "General"
        weakTopicKeys.add(`${question.test_id}:${topic}`)
      }

      weakTopicsCount = weakTopicKeys.size
    }
  }

  const profileIds = Array.from(
    new Set([
      ...attemptRows.map((attempt) => attempt.user_id),
      ...assignmentRows.map((assignment) => assignment.user_id),
    ])
  )

  const profilesById = new Map<string, ProfileRow>()

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", profileIds)

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profilesById.set(profile.id, profile)
    }
  }

  const assignmentsByTestId = new Map<string, AssignmentRow[]>()
  for (const assignment of assignmentRows) {
    const existing = assignmentsByTestId.get(assignment.test_id) ?? []
    existing.push(assignment)
    assignmentsByTestId.set(assignment.test_id, existing)
  }

  const completedAttemptsByTestId = new Map<string, AttemptRow[]>()
  for (const attempt of completedAttempts) {
    const existing = completedAttemptsByTestId.get(attempt.test_id) ?? []
    existing.push(attempt)
    completedAttemptsByTestId.set(attempt.test_id, existing)
  }

  const testPerformance: DashboardTest[] = testRows.slice(0, 10).map((test) => {
    const testAssignments = assignmentsByTestId.get(test.id) ?? []
    const testCompletedAttempts = completedAttemptsByTestId.get(test.id) ?? []
    const testCompletedAssignments = testAssignments.filter(
      (assignment) =>
        isAssignmentStatus(assignment.status) &&
        (assignment.status === "completed" || assignment.status === "failed")
    ).length
    const testAverageScore =
      testCompletedAttempts.length > 0
        ? Math.round(
            testCompletedAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
              testCompletedAttempts.length
          )
        : 0

    return {
      id: test.id,
      title: test.title,
      role: test.target_role ?? "All",
      assignedCount: testAssignments.length,
      completedCount: testCompletedAssignments,
      averageScore: testAverageScore,
      status: mapDashboardTestStatus(test.status),
    }
  })

  const testsById = new Map(testRows.map((test) => [test.id, test]))

  const recentAttempts: AdminDashboardRecentAttempt[] = completedAttempts
    .slice(0, 5)
    .map((attempt) => {
      const test = testsById.get(attempt.test_id)
      return {
        id: attempt.id,
        employeeName: profileDisplayName(profilesById.get(attempt.user_id)),
        testTitle: test?.title ?? "Unknown test",
        score: attempt.score ?? 0,
        passed: attempt.passed ?? false,
        completedAt: attempt.completed_at ?? new Date().toISOString(),
      }
    })

  return {
    kpiStats: buildKpiStats({
      documentsCount: documentsCount ?? 0,
      publishedTestsCount: publishedTests.length,
      totalAssignments: assignmentRows.length,
      completedAssignments,
      inProgressAssignments,
      averageScore,
      weakTopicsCount,
      activeEmployeesCount: activeEmployeeIds.size,
    }),
    testPerformance,
    weeklyCompletions: buildWeeklyCompletions(attemptRows),
    recentAttempts,
  }
}
