import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type EmployeeDetailAttemptStatus = "in_progress" | "completed" | "abandoned" | "unknown"

export type EmployeeDetailProfile = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export type EmployeeDetailMembership = {
  id: string
  department: string
  role: "employee"
  status: string
  jobTitle: string | null
  createdAt: string
}

export type EmployeeDetailSourceDocument = {
  id: string
  title: string
  status: string
}

export type EmployeeDetailAttempt = {
  id: string
  testId: string
  testTitle: string
  status: EmployeeDetailAttemptStatus
  score: number | null
  passed: boolean | null
  startedAt: string | null
  completedAt: string | null
  durationMinutes: number | null
  sourceDocuments: EmployeeDetailSourceDocument[]
}

export type EmployeeDetailTopicPerformance = {
  topic: string
  correctCount: number
  totalCount: number
  correctPercent: number
  recommendedAction: string
}

export type EmployeeDetailAssignedTest = {
  assignmentId: string
  testId: string
  testTitle: string
  sourceDocumentTitle: string
  difficulty: string
  deadline: string | null
}

export type EmployeeDepartmentComparison = {
  department: string
  employeeAverageScore: number | null
  departmentAverageScore: number | null
  departmentCompletedAttempts: number
  deltaFromDepartment: number | null
}

export type EmployeeDetailStats = {
  totalTests: number
  totalAssignedTests: number
  averageScore: number
  passRate: number
  weakTopicsCount: number
  strongestTopic: string | null
  strongestTopicMastery: number | null
}

export type EmployeeDetail = {
  profile: EmployeeDetailProfile
  membership: EmployeeDetailMembership
  stats: EmployeeDetailStats
  attempts: EmployeeDetailAttempt[]
  recentAttempts: EmployeeDetailAttempt[]
  strongTopics: EmployeeDetailTopicPerformance[]
  weakTopics: EmployeeDetailTopicPerformance[]
  allTopics: EmployeeDetailTopicPerformance[]
  assignedNotStartedTests: EmployeeDetailAssignedTest[]
  departmentComparison: EmployeeDepartmentComparison
  sourceMaterialsReviewed: EmployeeDetailSourceDocument[]
}

type MemberRow = {
  id: string
  user_id: string | null
  invited_email: string | null
  role: string
  status: string
  department: string | null
  job_title: string | null
  created_at: string
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

type AttemptRow = {
  id: string
  test_id: string
  status: string
  score: number | null
  passed: boolean | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

type TestRow = {
  id: string
  title: string
  source_document_id: string | null
  difficulty: string
}

type TestDocumentRow = {
  test_id: string
  document_id: string
}

type DocumentRow = {
  id: string
  title: string
  status: string
}

type AnswerRow = {
  attempt_id: string
  question_id: string
  is_correct: boolean | null
}

type QuestionTopicRow = {
  id: string
  topic: string | null
}

type DepartmentMemberRow = {
  user_id: string | null
}

type DepartmentAttemptRow = {
  user_id: string
  status: string
  score: number | null
}

type AssignmentRow = {
  id: string
  test_id: string
  deadline: string | null
}

function normalizeDepartment(department: string | null | undefined): string {
  const value = department?.trim()
  return value ? value : "Unassigned"
}

function profileDisplayName(profile: ProfileRow | null, invitedEmail: string | null): string {
  return profile?.full_name?.trim() || profile?.email || invitedEmail || "Employee"
}

function normalizeAttemptStatus(status: string): EmployeeDetailAttemptStatus {
  if (status === "in_progress" || status === "completed" || status === "abandoned") {
    return status
  }

  return "unknown"
}

function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function calculateDurationMinutes(
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (!startedAt || !completedAt) return null

  const startedTime = new Date(startedAt).getTime()
  const completedTime = new Date(completedAt).getTime()

  if (Number.isNaN(startedTime) || Number.isNaN(completedTime) || completedTime < startedTime) {
    return null
  }

  return Math.max(1, Math.round((completedTime - startedTime) / 60000))
}

function attemptSortDate(
  attempt: Pick<AttemptRow, "completed_at" | "started_at" | "created_at">
): string {
  return attempt.completed_at ?? attempt.started_at ?? attempt.created_at
}

function sortAttemptsByLatest(a: AttemptRow, b: AttemptRow): number {
  return new Date(attemptSortDate(b)).getTime() - new Date(attemptSortDate(a)).getTime()
}

function buildTopicPerformance(
  answers: AnswerRow[],
  topicsByQuestionId: Map<string, string>
): EmployeeDetailTopicPerformance[] {
  const topicStats = new Map<string, { correctCount: number; totalCount: number }>()

  for (const answer of answers) {
    const topic = topicsByQuestionId.get(answer.question_id)
    if (!topic) continue

    const existing = topicStats.get(topic) ?? { correctCount: 0, totalCount: 0 }
    existing.totalCount += 1
    if (answer.is_correct === true) {
      existing.correctCount += 1
    }
    topicStats.set(topic, existing)
  }

  return Array.from(topicStats.entries()).map(([topic, stats]) => ({
    topic,
    correctCount: stats.correctCount,
    totalCount: stats.totalCount,
    correctPercent: Math.round((stats.correctCount / stats.totalCount) * 100),
    recommendedAction: `Review ${topic} source material and revisit missed explanations.`,
  }))
}

function sortStrongTopics(
  a: EmployeeDetailTopicPerformance,
  b: EmployeeDetailTopicPerformance
): number {
  return (
    b.correctPercent - a.correctPercent ||
    b.totalCount - a.totalCount ||
    a.topic.localeCompare(b.topic)
  )
}

function sortWeakTopics(
  a: EmployeeDetailTopicPerformance,
  b: EmployeeDetailTopicPerformance
): number {
  return (
    a.correctPercent - b.correctPercent ||
    b.totalCount - a.totalCount ||
    a.topic.localeCompare(b.topic)
  )
}

function uniqueDocuments(
  documents: EmployeeDetailSourceDocument[]
): EmployeeDetailSourceDocument[] {
  const byId = new Map<string, EmployeeDetailSourceDocument>()

  for (const document of documents) {
    byId.set(document.id, document)
  }

  return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title))
}

async function getEmployeeMembership(
  employeeId: string,
  organizationId: string
): Promise<MemberRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, user_id, invited_email, role, status, department, job_title, created_at")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .eq("user_id", employeeId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch employee membership: ${error.message}`)
  }

  return data as MemberRow | null
}

async function getEmployeeProfile(employeeId: string): Promise<ProfileRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", employeeId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch employee profile: ${error.message}`)
  }

  return data as ProfileRow | null
}

async function getEmployeeAttempts(
  employeeId: string,
  organizationId: string
): Promise<AttemptRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, test_id, status, score, passed, started_at, completed_at, created_at")
    .eq("organization_id", organizationId)
    .eq("user_id", employeeId)

  if (error) {
    throw new Error(`Failed to fetch employee attempts: ${error.message}`)
  }

  return ((data ?? []) as AttemptRow[]).sort(sortAttemptsByLatest)
}

async function getEmployeeAssignments(
  employeeId: string,
  organizationId: string
): Promise<{ id: string }[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_assignments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", employeeId)

  if (error) {
    throw new Error(`Failed to fetch employee assignments: ${error.message}`)
  }

  return data ?? []
}

async function getEmployeeNotStartedAssignments(
  employeeId: string,
  organizationId: string
): Promise<AssignmentRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_assignments")
    .select("id, test_id, deadline")
    .eq("organization_id", organizationId)
    .eq("user_id", employeeId)
    .eq("status", "not_started")

  if (error) {
    throw new Error(`Failed to fetch employee not-started assignments: ${error.message}`)
  }

  return (data ?? []) as AssignmentRow[]
}

async function getTestsById(
  testIds: string[],
  organizationId: string
): Promise<Map<string, TestRow>> {
  if (testIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, source_document_id, difficulty")
    .eq("organization_id", organizationId)
    .in("id", testIds)

  if (error) {
    throw new Error(`Failed to fetch employee attempt tests: ${error.message}`)
  }

  return new Map(((data ?? []) as TestRow[]).map((test) => [test.id, test]))
}

async function getTestDocumentsByTestId(
  testIds: string[],
  organizationId: string
): Promise<Map<string, string[]>> {
  const documentsByTestId = new Map<string, string[]>()
  if (testIds.length === 0) return documentsByTestId

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_documents")
    .select("test_id, document_id")
    .eq("organization_id", organizationId)
    .in("test_id", testIds)

  if (error) {
    throw new Error(`Failed to fetch employee attempt source documents: ${error.message}`)
  }

  for (const row of (data ?? []) as TestDocumentRow[]) {
    const current = documentsByTestId.get(row.test_id) ?? []
    current.push(row.document_id)
    documentsByTestId.set(row.test_id, current)
  }

  return documentsByTestId
}

async function getDocumentsById(
  documentIds: string[],
  organizationId: string
): Promise<Map<string, DocumentRow>> {
  if (documentIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, status")
    .eq("organization_id", organizationId)
    .in("id", documentIds)

  if (error) {
    throw new Error(`Failed to fetch employee attempt documents: ${error.message}`)
  }

  return new Map(((data ?? []) as DocumentRow[]).map((document) => [document.id, document]))
}

async function getAnswersForAttempts(
  attemptIds: string[],
  organizationId: string
): Promise<AnswerRow[]> {
  if (attemptIds.length === 0) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_answers")
    .select("attempt_id, question_id, is_correct")
    .eq("organization_id", organizationId)
    .in("attempt_id", attemptIds)

  if (error) {
    throw new Error(`Failed to fetch employee attempt answers: ${error.message}`)
  }

  return (data ?? []) as AnswerRow[]
}

async function getQuestionTopicsById(
  questionIds: string[],
  organizationId: string
): Promise<Map<string, string>> {
  if (questionIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_questions")
    .select("id, topic")
    .eq("organization_id", organizationId)
    .in("id", questionIds)

  if (error) {
    throw new Error(`Failed to fetch employee weak topic questions: ${error.message}`)
  }

  return new Map(
    ((data ?? []) as QuestionTopicRow[]).map((question) => [
      question.id,
      question.topic?.trim() || "General",
    ])
  )
}

async function getDepartmentComparison({
  organizationId,
  department,
  employeeAverageScore,
}: {
  organizationId: string
  department: string
  employeeAverageScore: number | null
}): Promise<EmployeeDepartmentComparison> {
  const supabase = createAdminClient()
  let membersQuery = supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .eq("status", "active")
    .not("user_id", "is", null)

  if (department === "Unassigned") {
    membersQuery = membersQuery.is("department", null)
  } else {
    membersQuery = membersQuery.eq("department", department)
  }

  const { data: members, error: membersError } = await membersQuery

  if (membersError) {
    throw new Error(`Failed to fetch department employees: ${membersError.message}`)
  }

  const userIds = ((members ?? []) as DepartmentMemberRow[])
    .map((member) => member.user_id)
    .filter((userId): userId is string => Boolean(userId))

  if (userIds.length === 0) {
    return {
      department,
      employeeAverageScore,
      departmentAverageScore: null,
      departmentCompletedAttempts: 0,
      deltaFromDepartment: null,
    }
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from("test_attempts")
    .select("user_id, status, score")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .in("user_id", userIds)

  if (attemptsError) {
    throw new Error(`Failed to fetch department attempts: ${attemptsError.message}`)
  }

  const completedScores = ((attempts ?? []) as DepartmentAttemptRow[])
    .map((attempt) => attempt.score)
    .filter((score): score is number => typeof score === "number")
  const departmentAverageScore = averageScore(completedScores)

  return {
    department,
    employeeAverageScore,
    departmentAverageScore,
    departmentCompletedAttempts: completedScores.length,
    deltaFromDepartment:
      employeeAverageScore !== null && departmentAverageScore !== null
        ? employeeAverageScore - departmentAverageScore
        : null,
  }
}

export async function getSupabaseEmployeeDetail(
  employeeId: string,
  organizationId: string
): Promise<EmployeeDetail | null> {
  if (!organizationId) {
    throw new Error("Employee detail requires an organization scope")
  }

  const member = await getEmployeeMembership(employeeId, organizationId)

  if (!member || !member.user_id) {
    return null
  }

  const [profile, attempts, assignments, notStartedAssignments] = await Promise.all([
    getEmployeeProfile(employeeId),
    getEmployeeAttempts(employeeId, organizationId),
    getEmployeeAssignments(employeeId, organizationId),
    getEmployeeNotStartedAssignments(employeeId, organizationId),
  ])
  const testIds = Array.from(
    new Set([
      ...attempts.map((attempt) => attempt.test_id),
      ...notStartedAssignments.map((assignment) => assignment.test_id),
    ])
  )
  const [testsById, testDocumentsByTestId, answers] = await Promise.all([
    getTestsById(testIds, organizationId),
    getTestDocumentsByTestId(testIds, organizationId),
    getAnswersForAttempts(
      attempts.map((attempt) => attempt.id),
      organizationId
    ),
  ])
  const fallbackDocumentIds = Array.from(
    new Set(
      Array.from(testsById.values())
        .map((test) => test.source_document_id)
        .filter((documentId): documentId is string => Boolean(documentId))
    )
  )
  const joinedDocumentIds = Array.from(new Set(Array.from(testDocumentsByTestId.values()).flat()))
  const documentsById = await getDocumentsById(
    Array.from(new Set([...joinedDocumentIds, ...fallbackDocumentIds])),
    organizationId
  )
  const questionIds = Array.from(new Set(answers.map((answer) => answer.question_id)))
  const topicsByQuestionId = await getQuestionTopicsById(questionIds, organizationId)
  const allTopics = buildTopicPerformance(answers, topicsByQuestionId)
  const strongTopics = allTopics.filter((t) => t.correctPercent >= 80).sort(sortStrongTopics)
  const weakTopics = allTopics.filter((t) => t.correctPercent < 80).sort(sortWeakTopics)

  const detailAttempts = attempts.map((attempt) => {
    const test = testsById.get(attempt.test_id)
    const sourceDocumentIds = testDocumentsByTestId.get(attempt.test_id) ?? []
    const documentIds =
      sourceDocumentIds.length > 0 ? sourceDocumentIds : [test?.source_document_id]
    const sourceDocuments = documentIds
      .filter((documentId): documentId is string => Boolean(documentId))
      .map((documentId) => documentsById.get(documentId))
      .filter((document): document is DocumentRow => Boolean(document))
      .map((document) => ({
        id: document.id,
        title: document.title,
        status: document.status,
      }))

    return {
      id: attempt.id,
      testId: attempt.test_id,
      testTitle: test?.title ?? "Untitled test",
      status: normalizeAttemptStatus(attempt.status),
      score: attempt.score,
      passed: attempt.passed,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      durationMinutes: calculateDurationMinutes(attempt.started_at, attempt.completed_at),
      sourceDocuments,
    }
  })

  const completedAttempts = detailAttempts.filter((attempt) => attempt.status === "completed")
  const assignedNotStartedTests = notStartedAssignments
    .map((assignment) => {
      const test = testsById.get(assignment.test_id)
      const sourceDocumentIds = testDocumentsByTestId.get(assignment.test_id) ?? []
      const documentIds =
        sourceDocumentIds.length > 0 ? sourceDocumentIds : [test?.source_document_id]
      const sourceDocumentTitle =
        documentIds
          .filter((documentId): documentId is string => Boolean(documentId))
          .map((documentId) => documentsById.get(documentId)?.title)
          .filter((title): title is string => Boolean(title))
          .join(", ") || "No source document"

      return {
        assignmentId: assignment.id,
        testId: assignment.test_id,
        testTitle: test?.title ?? "Untitled test",
        sourceDocumentTitle,
        difficulty: test?.difficulty ?? "unknown",
        deadline: assignment.deadline,
      }
    })
    .sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (a.deadline) return -1
      if (b.deadline) return 1
      return a.testTitle.localeCompare(b.testTitle)
    })
  const completedScores = completedAttempts
    .map((attempt) => attempt.score)
    .filter((score): score is number => typeof score === "number")
  const average = averageScore(completedScores)
  const attemptsWithPassState = completedAttempts.filter((attempt) => attempt.passed !== null)
  const passRate =
    attemptsWithPassState.length === 0
      ? 0
      : Math.round(
          (attemptsWithPassState.filter((attempt) => attempt.passed === true).length /
            attemptsWithPassState.length) *
            100
        )
  const department = normalizeDepartment(member.department)
  const departmentComparison = await getDepartmentComparison({
    organizationId,
    department,
    employeeAverageScore: average,
  })

  return {
    profile: {
      id: member.user_id,
      name: profileDisplayName(profile, member.invited_email),
      email: profile?.email ?? member.invited_email ?? "No email",
      avatarUrl: profile?.avatar_url ?? null,
    },
    membership: {
      id: member.id,
      department,
      role: "employee",
      status: member.status,
      jobTitle: member.job_title,
      createdAt: member.created_at,
    },
    stats: {
      totalTests: completedAttempts.length,
      totalAssignedTests: assignments.length,
      averageScore: average ?? 0,
      passRate,
      weakTopicsCount: weakTopics.length,
      strongestTopic: strongTopics[0]?.topic ?? null,
      strongestTopicMastery: strongTopics[0]?.correctPercent ?? null,
    },
    attempts: detailAttempts,
    recentAttempts: detailAttempts.slice(0, 3),
    strongTopics,
    weakTopics,
    allTopics: allTopics.sort(
      (a, b) => b.correctPercent - a.correctPercent || a.topic.localeCompare(b.topic)
    ),
    assignedNotStartedTests,
    departmentComparison,
    sourceMaterialsReviewed: uniqueDocuments(
      detailAttempts.flatMap((attempt) => attempt.sourceDocuments)
    ),
  }
}
