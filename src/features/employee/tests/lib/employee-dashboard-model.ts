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
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import { createAdminClient } from "@/lib/supabase/admin"
import type { createTranslator } from "@/shared/i18n/translate"

type Translate = ReturnType<typeof createTranslator>["t"]

const DUE_SOON_DAYS = 7

export interface NextRequiredTest {
  test: EmployeeAssignedTest
  actionLabel: string
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

export function getNextRequiredTest(
  tests: EmployeeAssignedTest[],
  t: Translate
): NextRequiredTest | null {
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
  const action = getEmployeeTestAction(test, t)
  const actionLabel =
    test.status === "in_progress"
      ? t("employee.dashboard.continueTest")
      : t("employee.myTests.actions.startTest")

  return {
    test,
    actionLabel,
    actionHref: action.href ?? "/employee/tests",
    statusLabel: formatEmployeeTestStatus(getEmployeeTestDisplayStatus(test), t),
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
  organizationId: string,
  t: Translate
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
        topic: question.topic?.trim() || t("common.general"),
        explanation: question.explanation,
      },
    ])
  )
}

function buildDashboardWeakTopics(input: {
  answers: AnswerTopicRow[]
  questionTopicsById: Map<string, { topic: string; explanation: string | null }>
  t: Translate
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
    .slice(0, 2)
    .map(([topic, stats]) => ({
      topic,
      explanation:
        stats.firstExplanation ??
        input.t("employee.dashboard.missedTopicExplanation", {
          wrong: stats.wrongCount,
          total: stats.totalCount,
          plural: stats.totalCount === 1 ? "" : "s",
        }),
      recommendedAction: input.t("employee.dashboard.recommendedReview", { topic }),
    }))
}

function buildRecentFeedback(input: {
  latestAttempt: CompletedAttemptRow
  testsById: Map<string, EmployeeAssignedTest>
  answers: AnswerTopicRow[]
  questionTopicsById: Map<string, { topic: string; explanation: string | null }>
  t: Translate
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
    statusLabel: input.latestAttempt.passed
      ? input.t("status.employeeTest.passed")
      : input.t("status.employeeTest.failed"),
    weakTopicSummary:
      missedTopics.length > 0
        ? missedTopics.join(", ")
        : input.t("employee.dashboard.weakTopicsNoneIdentified"),
    resultHref: `/employee/tests/${test.id}/result?attemptId=${input.latestAttempt.id}`,
  }
}

async function getSupabaseAttemptInsights(input: {
  userId: string
  organizationId: string
  tests: EmployeeAssignedTest[]
  t: Translate
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
    input.organizationId,
    input.t
  )
  const testsById = new Map(input.tests.map((test) => [test.id, test]))

  return {
    recentFeedback: buildRecentFeedback({
      latestAttempt: attempts[0],
      testsById,
      answers: answerRows,
      questionTopicsById,
      t: input.t,
    }),
    weakTopics: buildDashboardWeakTopics({
      answers: answerRows,
      questionTopicsById,
      t: input.t,
    }),
  }
}

export async function getEmployeeDashboardAttemptInsights(input: {
  userId: string
  organizationId: string
  tests: EmployeeAssignedTest[]
  t: Translate
}): Promise<EmployeeDashboardAttemptInsights> {
  try {
    return await getSupabaseAttemptInsights(input)
  } catch (error) {
    console.error("Failed to load employee dashboard attempt insights from Supabase:", error)
  }

  return { recentFeedback: null, weakTopics: [] }
}
