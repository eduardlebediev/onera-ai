import "server-only"

import type { KpiStat, MockTest, TestStatus, WeeklyCompletion } from "@/data/mock/admin-dashboard"
import { createAdminClient } from "@/lib/supabase/admin"

// TODO: Scope dashboard reads to the authenticated admin's organization once auth/RLS lands.

export type AdminDashboardRecentAttempt = {
  id: string
  employeeName: string
  testTitle: string
  score: number
  passed: boolean
  completedAt: string
}

export type AdminDashboardSupabaseData = {
  kpiStats: KpiStat[]
  testPerformance: MockTest[]
  weeklyCompletions: WeeklyCompletion[]
  recentAttempts: AdminDashboardRecentAttempt[]
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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

function mapTestStatus(status: string): TestStatus {
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
      value: "—",
      description: "See Documents page for backend data",
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

export async function getAdminDashboardFromSupabase(): Promise<AdminDashboardSupabaseData | null> {
  const supabase = createAdminClient()

  const [
    { data: tests, error: testsError },
    { data: assignments, error: assignmentsError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
    supabase
      .from("tests")
      .select("id, title, status, target_role")
      .order("created_at", { ascending: false }),
    supabase.from("test_assignments").select("id, test_id, user_id, status"),
    supabase
      .from("test_attempts")
      .select("id, test_id, user_id, status, score, passed, completed_at")
      .order("completed_at", { ascending: false }),
  ])

  if (testsError || assignmentsError || attemptsError) {
    throw new Error(
      testsError?.message ?? assignmentsError?.message ?? attemptsError?.message ?? "Unknown error"
    )
  }

  const testRows = (tests ?? []) as TestRow[]
  const assignmentRows = (assignments ?? []) as AssignmentRow[]
  const attemptRows = (attempts ?? []) as AttemptRow[]

  if (testRows.length === 0 && assignmentRows.length === 0 && attemptRows.length === 0) {
    return null
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

  const testPerformance: MockTest[] = testRows.slice(0, 10).map((test) => {
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
      status: mapTestStatus(test.status),
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
