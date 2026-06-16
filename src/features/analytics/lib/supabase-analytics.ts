import "server-only"

import type {
  KpiStat,
  DashboardTest,
  DashboardTestStatus,
} from "@/features/analytics/types/admin-dashboard"
import { createAdminClient } from "@/lib/supabase/admin"

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

type AnswerRow = {
  attempt_id: string
  question_id: string
  is_correct: boolean | null
}

type QuestionRow = {
  id: string
  test_id: string
  question_text: string
  topic: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
}

export type AnalyticsWeakTopic = {
  topic: string
  wrongAnswers: number
  totalAnswers: number
  correctnessPct: number
}

export type AnalyticsDifficultQuestion = {
  id: string
  questionText: string
  topic: string
  testTitle: string
  wrongAnswers: number
  totalAnswers: number
  wrongRatioPct: number
}

export type AnalyticsEmployeePerformance = {
  userId: string
  name: string
  email: string
  completedAttempts: number
  failedAttempts: number
  averageScore: number
}

export type AdminAnalyticsData = {
  hasActivity: boolean
  overviewStats: KpiStat[]
  weakTopics: AnalyticsWeakTopic[]
  difficultQuestions: AnalyticsDifficultQuestion[]
  failedEmployees: AnalyticsEmployeePerformance[]
  bestPerformers: AnalyticsEmployeePerformance[]
  testPerformance: DashboardTest[]
}

function mapDashboardTestStatus(status: string): DashboardTestStatus {
  if (status === "published") return "active"
  if (status === "archived") return "archived"
  return "draft"
}

function profileDisplayName(profile: ProfileRow | undefined): string {
  return profile?.full_name ?? profile?.email ?? "Employee"
}

function isFinishedAssignment(status: string): boolean {
  return status === "completed" || status === "failed"
}

function roundAverage(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function buildOverviewStats(input: {
  averageScore: number | null
  completionRate: number
  completedAttemptsCount: number
  weakTopicsCount: number
  difficultQuestionsCount: number
  failedAttemptsCount: number
}): KpiStat[] {
  return [
    {
      label: "Team Average Score",
      value: input.averageScore !== null ? `${input.averageScore}%` : "—",
      description:
        input.averageScore !== null ? "Across completed attempts" : "No completed attempts yet",
    },
    {
      label: "Completion Rate",
      value: `${input.completionRate}%`,
      description: "Finished assignments",
    },
    {
      label: "Completed Attempts",
      value: String(input.completedAttemptsCount),
      description: "Submitted tests",
    },
    {
      label: "Weak Topics",
      value: String(input.weakTopicsCount),
      description: input.weakTopicsCount > 0 ? "Topics with wrong answers" : "No weak topics yet",
    },
    {
      label: "Difficult Questions",
      value: String(input.difficultQuestionsCount),
      description:
        input.difficultQuestionsCount > 0 ? "Questions with wrong answers" : "No difficult items",
    },
    {
      label: "Failed Attempts",
      value: String(input.failedAttemptsCount),
      description:
        input.failedAttemptsCount > 0 ? "Need follow-up review" : "No failed attempts yet",
    },
  ]
}

function buildWeakTopics(
  answers: AnswerRow[],
  questionsById: Map<string, QuestionRow>
): AnalyticsWeakTopic[] {
  const totalsByTopic = new Map<string, { total: number; wrong: number }>()

  for (const answer of answers) {
    if (answer.is_correct === null) continue

    const question = questionsById.get(answer.question_id)
    if (!question) continue

    const topic = question.topic ?? "General"
    const existing = totalsByTopic.get(topic) ?? { total: 0, wrong: 0 }
    existing.total += 1

    if (answer.is_correct === false) {
      existing.wrong += 1
    }

    totalsByTopic.set(topic, existing)
  }

  return Array.from(totalsByTopic.entries())
    .filter(([, totals]) => totals.wrong > 0)
    .map(([topic, totals]) => ({
      topic,
      wrongAnswers: totals.wrong,
      totalAnswers: totals.total,
      correctnessPct:
        totals.total > 0 ? Math.round(((totals.total - totals.wrong) / totals.total) * 100) : 0,
    }))
    .sort((a, b) => a.correctnessPct - b.correctnessPct || b.wrongAnswers - a.wrongAnswers)
    .slice(0, 10)
}

function buildDifficultQuestions(input: {
  answers: AnswerRow[]
  questionsById: Map<string, QuestionRow>
  testsById: Map<string, TestRow>
}): AnalyticsDifficultQuestion[] {
  const totalsByQuestionId = new Map<string, { total: number; wrong: number }>()

  for (const answer of input.answers) {
    if (answer.is_correct === null) continue

    const question = input.questionsById.get(answer.question_id)
    if (!question) continue

    const existing = totalsByQuestionId.get(question.id) ?? { total: 0, wrong: 0 }
    existing.total += 1

    if (answer.is_correct === false) {
      existing.wrong += 1
    }

    totalsByQuestionId.set(question.id, existing)
  }

  return Array.from(totalsByQuestionId.entries())
    .filter(([, totals]) => totals.wrong > 0)
    .flatMap(([questionId, totals]) => {
      const question = input.questionsById.get(questionId)
      if (!question) return []

      const test = input.testsById.get(question.test_id)

      return [
        {
          id: questionId,
          questionText: question.question_text,
          topic: question.topic ?? "General",
          testTitle: test?.title ?? "Unknown test",
          wrongAnswers: totals.wrong,
          totalAnswers: totals.total,
          wrongRatioPct: totals.total > 0 ? Math.round((totals.wrong / totals.total) * 100) : 0,
        },
      ]
    })
    .sort((a, b) => b.wrongRatioPct - a.wrongRatioPct || b.wrongAnswers - a.wrongAnswers)
    .slice(0, 10)
}

function buildEmployeePerformance(input: {
  attempts: AttemptRow[]
  profilesById: Map<string, ProfileRow>
}): {
  failedEmployees: AnalyticsEmployeePerformance[]
  bestPerformers: AnalyticsEmployeePerformance[]
} {
  const completedAttemptsByUserId = new Map<string, AttemptRow[]>()

  for (const attempt of input.attempts) {
    if (attempt.status !== "completed" || attempt.score === null) continue

    const existing = completedAttemptsByUserId.get(attempt.user_id) ?? []
    existing.push(attempt)
    completedAttemptsByUserId.set(attempt.user_id, existing)
  }

  const employees = Array.from(completedAttemptsByUserId.entries()).map(([userId, attempts]) => {
    const profile = input.profilesById.get(userId)
    const scores = attempts.map((attempt) => attempt.score ?? 0)

    return {
      userId,
      name: profileDisplayName(profile),
      email: profile?.email ?? "No email",
      completedAttempts: attempts.length,
      failedAttempts: attempts.filter((attempt) => attempt.passed === false).length,
      averageScore: roundAverage(scores),
    }
  })

  return {
    failedEmployees: employees
      .filter((employee) => employee.failedAttempts > 0)
      .sort((a, b) => b.failedAttempts - a.failedAttempts || a.averageScore - b.averageScore)
      .slice(0, 5),
    bestPerformers: employees
      .filter((employee) => employee.completedAttempts > 0)
      .sort((a, b) => b.averageScore - a.averageScore || b.completedAttempts - a.completedAttempts)
      .slice(0, 5),
  }
}

function buildTestPerformance(input: {
  tests: TestRow[]
  assignments: AssignmentRow[]
  completedAttempts: AttemptRow[]
}): DashboardTest[] {
  const assignmentsByTestId = new Map<string, AssignmentRow[]>()
  const completedAttemptsByTestId = new Map<string, AttemptRow[]>()

  for (const assignment of input.assignments) {
    const existing = assignmentsByTestId.get(assignment.test_id) ?? []
    existing.push(assignment)
    assignmentsByTestId.set(assignment.test_id, existing)
  }

  for (const attempt of input.completedAttempts) {
    const existing = completedAttemptsByTestId.get(attempt.test_id) ?? []
    existing.push(attempt)
    completedAttemptsByTestId.set(attempt.test_id, existing)
  }

  return input.tests.map((test) => {
    const testAssignments = assignmentsByTestId.get(test.id) ?? []
    const testCompletedAttempts = completedAttemptsByTestId.get(test.id) ?? []

    return {
      id: test.id,
      title: test.title,
      role: test.target_role ?? "All",
      assignedCount: testAssignments.length,
      completedCount: testAssignments.filter((assignment) =>
        isFinishedAssignment(assignment.status)
      ).length,
      averageScore: roundAverage(testCompletedAttempts.map((attempt) => attempt.score ?? 0)),
      status: mapDashboardTestStatus(test.status),
    }
  })
}

async function fetchProfilesById(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  if (error) {
    throw new Error(`Failed to fetch analytics profiles: ${error.message}`)
  }

  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
}

export async function getAdminAnalyticsFromSupabase(
  organizationId: string
): Promise<AdminAnalyticsData> {
  if (!organizationId) {
    throw new Error("Admin analytics requires an organization scope")
  }

  const supabase = createAdminClient()

  const [
    { data: tests, error: testsError },
    { data: assignments, error: assignmentsError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
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

  if (testsError || assignmentsError || attemptsError) {
    throw new Error(
      testsError?.message ?? assignmentsError?.message ?? attemptsError?.message ?? "Unknown error"
    )
  }

  const testRows = (tests ?? []) as TestRow[]
  const assignmentRows = (assignments ?? []) as AssignmentRow[]
  const attemptRows = (attempts ?? []) as AttemptRow[]
  const completedAttempts = attemptRows.filter(
    (attempt) =>
      attempt.status === "completed" && attempt.score !== null && attempt.completed_at !== null
  )

  const [answerRows, questionRows, profilesById] = await Promise.all([
    completedAttempts.length > 0
      ? supabase
          .from("test_answers")
          .select("attempt_id, question_id, is_correct")
          .eq("organization_id", organizationId)
          .in(
            "attempt_id",
            completedAttempts.map((attempt) => attempt.id)
          )
          .then(({ data, error }) => {
            if (error) throw new Error(`Failed to fetch analytics answers: ${error.message}`)
            return (data ?? []) as AnswerRow[]
          })
      : Promise.resolve([] as AnswerRow[]),
    testRows.length > 0
      ? supabase
          .from("test_questions")
          .select("id, test_id, question_text, topic")
          .eq("organization_id", organizationId)
          .in(
            "test_id",
            testRows.map((test) => test.id)
          )
          .then(({ data, error }) => {
            if (error) throw new Error(`Failed to fetch analytics questions: ${error.message}`)
            return (data ?? []) as QuestionRow[]
          })
      : Promise.resolve([] as QuestionRow[]),
    fetchProfilesById(
      supabase,
      Array.from(
        new Set([
          ...assignmentRows.map((assignment) => assignment.user_id),
          ...attemptRows.map((attempt) => attempt.user_id),
        ])
      )
    ),
  ])

  const testsById = new Map(testRows.map((test) => [test.id, test]))
  const questionsById = new Map(questionRows.map((question) => [question.id, question]))
  const weakTopics = buildWeakTopics(answerRows, questionsById)
  const difficultQuestions = buildDifficultQuestions({
    answers: answerRows,
    questionsById,
    testsById,
  })
  const { failedEmployees, bestPerformers } = buildEmployeePerformance({
    attempts: attemptRows,
    profilesById,
  })
  const finishedAssignments = assignmentRows.filter((assignment) =>
    isFinishedAssignment(assignment.status)
  )
  const completionRate =
    assignmentRows.length > 0
      ? Math.round((finishedAssignments.length / assignmentRows.length) * 100)
      : 0
  const averageScore =
    completedAttempts.length > 0
      ? roundAverage(completedAttempts.map((attempt) => attempt.score ?? 0))
      : null
  const failedAttemptsCount = completedAttempts.filter((attempt) => attempt.passed === false).length

  return {
    hasActivity: testRows.length > 0 || assignmentRows.length > 0 || completedAttempts.length > 0,
    overviewStats: buildOverviewStats({
      averageScore,
      completionRate,
      completedAttemptsCount: completedAttempts.length,
      weakTopicsCount: weakTopics.length,
      difficultQuestionsCount: difficultQuestions.length,
      failedAttemptsCount,
    }),
    weakTopics,
    difficultQuestions,
    failedEmployees,
    bestPerformers,
    testPerformance: buildTestPerformance({
      tests: testRows,
      assignments: assignmentRows,
      completedAttempts,
    }),
  }
}
