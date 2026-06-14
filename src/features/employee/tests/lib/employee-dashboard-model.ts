import "server-only"

import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { getDaysUntilDeadline } from "@/features/employee/tests/lib/employee-test-format"
import {
  formatEmployeeTestStatus,
  getEmployeeTestAction,
  getEmployeeTestDisplayStatus,
  isEmployeeTestFinished,
  isEmployeeTestOverdue,
  isEmployeeTestTakeBlocked,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import {
  getEmployeeTestAttemptByTestId,
  type ResultWeakTopicRecord,
} from "@/features/employee/tests/mock/test-results"
import { createAdminClient } from "@/lib/supabase/admin"

const DUE_SOON_DAYS = 7

export interface NextRequiredTest {
  test: EmployeeAssignedTest
  actionLabel: "Start Test" | "Continue Test"
  actionHref: string
  statusLabel: string
}

export interface RecentFeedbackItem {
  testId: string
  title: string
  score: number
  passed: boolean
  statusLabel: string
  weakTopicSummary: string
  resultHref: string
}

export interface DashboardWeakTopic {
  topic: string
  explanation: string
  recommendedAction: string
}

export interface DashboardQuickAction {
  label: string
  description: string
  href: string
}

export interface EmployeeDashboardAttemptInsights {
  recentFeedback: RecentFeedbackItem | null
  weakTopics: DashboardWeakTopic[]
}

type CompletedAttemptRow = {
  id: string
  test_id: string
  score: number | null
  passed: boolean | null
  completed_at: string | null
}

type AnswerTopicRow = {
  attempt_id: string
  question_id: string
  is_correct: boolean | null
}

type QuestionTopicRow = {
  id: string
  topic: string | null
  explanation: string | null
}

function isEmployeeTestDueSoon(test: EmployeeAssignedTest): boolean {
  if (isEmployeeTestFinished(test)) return false
  const daysUntil = getDaysUntilDeadline(test.deadline)
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= DUE_SOON_DAYS
}

function getNextTestPriority(test: EmployeeAssignedTest): number {
  if (test.status === "in_progress") return 1
  if (isEmployeeTestOverdue(test)) return 2
  if (test.status === "not_started") return 3
  if (isEmployeeTestDueSoon(test)) return 4
  return 5
}

export function getNextRequiredTest(tests: EmployeeAssignedTest[]): NextRequiredTest | null {
  const actionable = tests.filter(
    (test) => !isEmployeeTestFinished(test) && !isEmployeeTestTakeBlocked(test)
  )
  if (actionable.length === 0) return null

  const sorted = [...actionable].sort((a, b) => {
    const priorityDiff = getNextTestPriority(a) - getNextTestPriority(b)
    if (priorityDiff !== 0) return priorityDiff
    const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
    const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
    return aDeadline - bDeadline
  })

  const test = sorted[0]
  const action = getEmployeeTestAction(test)
  const actionLabel = test.status === "in_progress" ? "Continue Test" : "Start Test"

  return {
    test,
    actionLabel,
    actionHref: action.href ?? "/employee/tests",
    statusLabel: formatEmployeeTestStatus(getEmployeeTestDisplayStatus(test)),
  }
}

function getRecentFeedbackFromMock(tests: EmployeeAssignedTest[]): RecentFeedbackItem | null {
  const finishedTests = tests.filter(isEmployeeTestFinished)
  if (finishedTests.length === 0) return null

  const withAttempts = finishedTests
    .map((test) => {
      const attempt = getEmployeeTestAttemptByTestId(test.id)
      if (!attempt || test.score === null || test.passed === null) return null

      return {
        test,
        attempt,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (a, b) =>
        new Date(b.attempt.completedDate).getTime() - new Date(a.attempt.completedDate).getTime()
    )

  const latest = withAttempts[0]
  if (!latest) return null

  const weakTopicSummary =
    latest.attempt.weakTopics.length > 0
      ? latest.attempt.weakTopics.map((topic) => topic.topic).join(", ")
      : "No weak topics identified in this attempt."

  return {
    testId: latest.test.id,
    title: latest.test.title,
    score: latest.test.score ?? 0,
    passed: latest.test.passed ?? false,
    statusLabel: latest.test.passed ? "Passed" : "Failed",
    weakTopicSummary,
    resultHref: latest.test.latestAttemptId
      ? `/employee/tests/${latest.test.id}/result?attemptId=${latest.test.latestAttemptId}`
      : `/employee/tests/${latest.test.id}/result`,
  }
}

function getDashboardWeakTopicsFromMock(tests: EmployeeAssignedTest[]): DashboardWeakTopic[] {
  const topicsByName = new Map<string, ResultWeakTopicRecord>()

  for (const test of tests.filter(isEmployeeTestFinished)) {
    const attempt = getEmployeeTestAttemptByTestId(test.id)
    if (!attempt) continue

    for (const topic of attempt.weakTopics) {
      if (!topicsByName.has(topic.topic)) {
        topicsByName.set(topic.topic, topic)
      }
    }
  }

  return Array.from(topicsByName.values())
    .slice(0, 3)
    .map((topic) => ({
      topic: topic.topic,
      explanation: topic.explanation,
      recommendedAction: topic.recommendedAction,
    }))
}

function hasMockOnlyTests(tests: EmployeeAssignedTest[]): boolean {
  return tests.some((test) => !isUuid(test.id))
}

function getFallbackAttemptInsights(
  tests: EmployeeAssignedTest[]
): EmployeeDashboardAttemptInsights {
  return {
    recentFeedback: getRecentFeedbackFromMock(tests),
    weakTopics: getDashboardWeakTopicsFromMock(tests),
  }
}

async function getCompletedAttemptRows(input: {
  userId: string
  organizationId: string
  testIds: string[]
}): Promise<CompletedAttemptRow[]> {
  if (input.testIds.length === 0) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, test_id, score, passed, completed_at")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)
    .eq("status", "completed")
    .in("test_id", input.testIds)
    .order("completed_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch dashboard attempts: ${error.message}`)
  }

  return ((data ?? []) as CompletedAttemptRow[]).sort((a, b) => {
    const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0
    const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0
    return bTime - aTime
  })
}

async function getAnswerRowsForAttempts(
  attemptIds: string[],
  organizationId: string
): Promise<AnswerTopicRow[]> {
  if (attemptIds.length === 0) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_answers")
    .select("attempt_id, question_id, is_correct")
    .eq("organization_id", organizationId)
    .in("attempt_id", attemptIds)

  if (error) {
    throw new Error(`Failed to fetch dashboard answers: ${error.message}`)
  }

  return (data ?? []) as AnswerTopicRow[]
}

async function getQuestionTopicsById(
  questionIds: string[],
  organizationId: string
): Promise<Map<string, { topic: string; explanation: string | null }>> {
  if (questionIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_questions")
    .select("id, topic, explanation")
    .eq("organization_id", organizationId)
    .in("id", questionIds)

  if (error) {
    throw new Error(`Failed to fetch dashboard question topics: ${error.message}`)
  }

  return new Map(
    ((data ?? []) as QuestionTopicRow[]).map((question) => [
      question.id,
      {
        topic: question.topic?.trim() || "General",
        explanation: question.explanation,
      },
    ])
  )
}

function buildDashboardWeakTopics(input: {
  answers: AnswerTopicRow[]
  questionTopicsById: Map<string, { topic: string; explanation: string | null }>
}): DashboardWeakTopic[] {
  const statsByTopic = new Map<
    string,
    { totalCount: number; wrongCount: number; firstExplanation: string | null }
  >()

  for (const answer of input.answers) {
    if (answer.is_correct === null) continue

    const questionTopic = input.questionTopicsById.get(answer.question_id)
    if (!questionTopic) continue

    const existing = statsByTopic.get(questionTopic.topic) ?? {
      totalCount: 0,
      wrongCount: 0,
      firstExplanation: null,
    }
    existing.totalCount += 1

    if (answer.is_correct === false) {
      existing.wrongCount += 1
      existing.firstExplanation = existing.firstExplanation ?? questionTopic.explanation
    }

    statsByTopic.set(questionTopic.topic, existing)
  }

  return Array.from(statsByTopic.entries())
    .filter(([, stats]) => stats.wrongCount > 0)
    .sort((a, b) => {
      const aCorrectPct = (a[1].totalCount - a[1].wrongCount) / a[1].totalCount
      const bCorrectPct = (b[1].totalCount - b[1].wrongCount) / b[1].totalCount
      return aCorrectPct - bCorrectPct || b[1].wrongCount - a[1].wrongCount
    })
    .slice(0, 3)
    .map(([topic, stats]) => ({
      topic,
      explanation:
        stats.firstExplanation ??
        `You missed ${stats.wrongCount} of ${stats.totalCount} answered question${
          stats.totalCount === 1 ? "" : "s"
        } in this topic.`,
      recommendedAction: `Review the ${topic} source material before your next attempt.`,
    }))
}

function buildRecentFeedback(input: {
  latestAttempt: CompletedAttemptRow
  testsById: Map<string, EmployeeAssignedTest>
  answers: AnswerTopicRow[]
  questionTopicsById: Map<string, { topic: string; explanation: string | null }>
}): RecentFeedbackItem | null {
  const test = input.testsById.get(input.latestAttempt.test_id)
  if (!test || input.latestAttempt.score === null || input.latestAttempt.passed === null) {
    return null
  }

  const missedTopics = Array.from(
    new Set(
      input.answers
        .filter(
          (answer) => answer.attempt_id === input.latestAttempt.id && answer.is_correct === false
        )
        .map((answer) => input.questionTopicsById.get(answer.question_id)?.topic)
        .filter((topic): topic is string => Boolean(topic))
    )
  )

  return {
    testId: test.id,
    title: test.title,
    score: input.latestAttempt.score,
    passed: input.latestAttempt.passed,
    statusLabel: input.latestAttempt.passed ? "Passed" : "Failed",
    weakTopicSummary:
      missedTopics.length > 0
        ? missedTopics.join(", ")
        : "No weak topics identified in this attempt.",
    resultHref: `/employee/tests/${test.id}/result?attemptId=${input.latestAttempt.id}`,
  }
}

async function getSupabaseAttemptInsights(input: {
  userId: string
  organizationId: string
  tests: EmployeeAssignedTest[]
}): Promise<EmployeeDashboardAttemptInsights> {
  const testIds = input.tests.map((test) => test.id).filter(isUuid)
  const attempts = await getCompletedAttemptRows({
    userId: input.userId,
    organizationId: input.organizationId,
    testIds,
  })

  if (attempts.length === 0) {
    return {
      recentFeedback: null,
      weakTopics: [],
    }
  }

  const answerRows = await getAnswerRowsForAttempts(
    attempts.map((attempt) => attempt.id),
    input.organizationId
  )
  const questionTopicsById = await getQuestionTopicsById(
    Array.from(new Set(answerRows.map((answer) => answer.question_id))),
    input.organizationId
  )
  const testsById = new Map(input.tests.map((test) => [test.id, test]))

  return {
    recentFeedback: buildRecentFeedback({
      latestAttempt: attempts[0],
      testsById,
      answers: answerRows,
      questionTopicsById,
    }),
    weakTopics: buildDashboardWeakTopics({
      answers: answerRows,
      questionTopicsById,
    }),
  }
}

export async function getEmployeeDashboardAttemptInsights(input: {
  userId: string
  organizationId: string
  tests: EmployeeAssignedTest[]
}): Promise<EmployeeDashboardAttemptInsights> {
  try {
    const insights = await getSupabaseAttemptInsights(input)

    if (
      insights.recentFeedback ||
      insights.weakTopics.length > 0 ||
      !hasMockOnlyTests(input.tests)
    ) {
      return insights
    }
  } catch (error) {
    console.error("Failed to load employee dashboard attempt insights from Supabase:", error)
  }

  return hasMockOnlyTests(input.tests)
    ? getFallbackAttemptInsights(input.tests)
    : { recentFeedback: null, weakTopics: [] }
}

export function getDashboardQuickActions(
  tests: EmployeeAssignedTest[],
  nextTest: NextRequiredTest | null,
  recentFeedback: RecentFeedbackItem | null
): DashboardQuickAction[] {
  const actions: DashboardQuickAction[] = [
    {
      label: "My Tests",
      description: "View all assigned knowledge checks.",
      href: "/employee/tests",
    },
  ]

  if (recentFeedback) {
    actions.push({
      label: "Review Feedback",
      description: `See results for ${recentFeedback.title}.`,
      href: recentFeedback.resultHref,
    })
  }

  if (nextTest) {
    actions.push({
      label: nextTest.actionLabel,
      description: `Pick up ${nextTest.test.title}.`,
      href: nextTest.actionHref,
    })
  }

  return actions
}
