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

export function getRecentFeedback(tests: EmployeeAssignedTest[]): RecentFeedbackItem | null {
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
    resultHref: `/employee/tests/${latest.test.id}/result`,
  }
}

export function getDashboardWeakTopics(tests: EmployeeAssignedTest[]): DashboardWeakTopic[] {
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
