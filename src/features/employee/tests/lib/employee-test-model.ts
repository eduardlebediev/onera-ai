import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"
import { getDaysUntilDeadline } from "@/features/employee/tests/lib/employee-test-format"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import type { createTranslator } from "@/shared/i18n/translate"
import type { TranslationKey } from "@/shared/i18n/translate"

type Translate = ReturnType<typeof createTranslator>["t"]

export type EmployeeTestDisplayStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed"
  | "overdue"

export type EmployeeTestFilter = "all" | EmployeeTestDisplayStatus

const EMPLOYEE_TEST_STATUS_LABEL_KEYS: Record<EmployeeTestDisplayStatus, TranslationKey> = {
  not_started: "status.employeeTest.notStarted",
  in_progress: "status.employeeTest.inProgress",
  completed: "status.employeeTest.completed",
  failed: "status.employeeTest.failed",
  overdue: "status.employeeTest.overdue",
}

export function getEmployeeTestFilterOptions(t: Translate): Array<{
  label: string
  value: EmployeeTestFilter
}> {
  return [
    { label: t("common.all"), value: "all" },
    { label: t("status.employeeTest.notStarted"), value: "not_started" },
    { label: t("status.employeeTest.inProgress"), value: "in_progress" },
    { label: t("status.employeeTest.completed"), value: "completed" },
    { label: t("status.employeeTest.failed"), value: "failed" },
    { label: t("status.employeeTest.overdue"), value: "overdue" },
  ]
}

export interface EmployeeTestAction {
  label: string
  href?: string
  variant: "default" | "outline"
  disabled?: boolean
  disabledReason?: string
}

export function isEmployeeTestTakeBlocked(test: EmployeeAssignedTest): boolean {
  if (isEmployeeTestFinished(test)) return false

  return !isTestAssignable({
    status: "published",
    isActive: test.testIsActive ?? true,
    sourceValidity: test.sourceValidity ?? "valid",
  })
}

export function isEmployeeTestFinished(test: EmployeeAssignedTest): boolean {
  return test.status === "completed" || test.status === "failed"
}

export function isEmployeeTestOverdue(test: EmployeeAssignedTest): boolean {
  if (isEmployeeTestFinished(test)) return false
  const daysUntilDeadline = getDaysUntilDeadline(test.deadline)
  return daysUntilDeadline !== null && daysUntilDeadline < 0
}

export function getEmployeeTestDisplayStatus(
  test: EmployeeAssignedTest
): EmployeeTestDisplayStatus {
  if (isEmployeeTestOverdue(test)) return "overdue"
  return test.status
}

export function formatEmployeeTestStatus(status: EmployeeTestDisplayStatus, t: Translate): string {
  return t(EMPLOYEE_TEST_STATUS_LABEL_KEYS[status])
}

const EMPLOYEE_TEST_STATUS_BADGE_CLASS = {
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400",
  inProgress:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400",
  notStarted: "text-muted-foreground",
} as const

export function getPassFailBadgeClass(passed: boolean): string {
  return passed
    ? EMPLOYEE_TEST_STATUS_BADGE_CLASS.completed
    : EMPLOYEE_TEST_STATUS_BADGE_CLASS.danger
}

export function getEmployeeTestStatusBadgeClass(status: EmployeeTestDisplayStatus): string {
  switch (status) {
    case "completed":
      return EMPLOYEE_TEST_STATUS_BADGE_CLASS.completed
    case "in_progress":
      return EMPLOYEE_TEST_STATUS_BADGE_CLASS.inProgress
    case "failed":
    case "overdue":
      return EMPLOYEE_TEST_STATUS_BADGE_CLASS.danger
    case "not_started":
      return EMPLOYEE_TEST_STATUS_BADGE_CLASS.notStarted
  }
}

export function filterEmployeeTests(
  tests: EmployeeAssignedTest[],
  filter: EmployeeTestFilter
): EmployeeAssignedTest[] {
  if (filter === "all") return tests

  if (filter === "overdue") {
    return tests.filter((test) => getEmployeeTestDisplayStatus(test) === "overdue")
  }

  if (filter === "completed") {
    return tests.filter((test) => test.status === "completed")
  }

  return tests.filter((test) => test.status === filter)
}

export function getEmployeeTestAction(
  test: EmployeeAssignedTest,
  t: Translate
): EmployeeTestAction {
  const displayStatus = getEmployeeTestDisplayStatus(test)
  const resultHref =
    test.latestAttemptId != null
      ? `/employee/tests/${test.id}/result?attemptId=${test.latestAttemptId}`
      : `/employee/tests/${test.id}/result`

  if (isEmployeeTestTakeBlocked(test)) {
    return {
      label: t("employee.myTests.actions.unavailable"),
      variant: "outline",
      disabled: true,
      disabledReason: test.sourceInvalidReason ?? t("employee.myTests.actions.unavailableReason"),
    }
  }

  if (displayStatus === "not_started" || displayStatus === "overdue") {
    return {
      label: t("employee.myTests.actions.startTest"),
      href: `/employee/tests/${test.id}/take`,
      variant: "default",
    }
  }

  if (displayStatus === "in_progress") {
    return {
      label: t("employee.myTests.actions.continue"),
      href: `/employee/tests/${test.id}/take`,
      variant: "default",
    }
  }

  if (test.status === "failed") {
    if (test.canRetake) {
      return {
        label: t("employee.myTests.actions.retakeTest"),
        href: `/employee/tests/${test.id}/take`,
        variant: "default",
      }
    }

    return {
      label: t("employee.myTests.actions.review"),
      href: resultHref,
      variant: "outline",
    }
  }

  return {
    label: t("employee.myTests.actions.viewResults"),
    href: resultHref,
    variant: "outline",
  }
}

export function formatPassFailStatus(
  score: number | null,
  passed: boolean | null,
  t: Translate
): string | null {
  if (score === null || passed === null) return null
  return passed ? t("status.employeeTest.passed") : t("status.employeeTest.failed")
}

export function formatDifficultyLabel(difficulty: string, t: Translate): string {
  const key = `common.difficulty.${difficulty}` as TranslationKey
  const label = t(key)
  return label === key ? difficulty : label
}
