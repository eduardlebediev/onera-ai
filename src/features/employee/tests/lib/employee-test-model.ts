import { getDaysUntilDeadline } from "@/features/employee/tests/lib/employee-test-format"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"

export type EmployeeTestDisplayStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed"
  | "overdue"

export type EmployeeTestFilter = "all" | EmployeeTestDisplayStatus

export const EMPLOYEE_TEST_FILTER_OPTIONS: Array<{
  label: string
  value: EmployeeTestFilter
}> = [
  { label: "All", value: "all" },
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" },
]

export interface EmployeeTestAction {
  label: string
  href: string
  variant: "default" | "outline"
}

export function isEmployeeTestFinished(test: EmployeeAssignedTest): boolean {
  return test.status === "completed" || test.status === "failed"
}

export function isEmployeeTestOverdue(test: EmployeeAssignedTest): boolean {
  if (isEmployeeTestFinished(test)) return false
  return getDaysUntilDeadline(test.deadline) < 0
}

export function getEmployeeTestDisplayStatus(
  test: EmployeeAssignedTest
): EmployeeTestDisplayStatus {
  if (isEmployeeTestOverdue(test)) return "overdue"
  return test.status
}

export function formatEmployeeTestStatus(status: EmployeeTestDisplayStatus): string {
  switch (status) {
    case "not_started":
      return "Not started"
    case "in_progress":
      return "In progress"
    case "completed":
      return "Completed"
    case "failed":
      return "Failed"
    case "overdue":
      return "Overdue"
  }
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
    return tests.filter(isEmployeeTestFinished)
  }

  return tests.filter((test) => test.status === filter)
}

export function getEmployeeTestAction(test: EmployeeAssignedTest): EmployeeTestAction {
  const displayStatus = getEmployeeTestDisplayStatus(test)

  if (displayStatus === "not_started" || displayStatus === "overdue") {
    return {
      label: "Start Test",
      href: `/employee/tests/${test.id}/take`,
      variant: "default",
    }
  }

  if (displayStatus === "in_progress") {
    return {
      label: "Continue",
      href: `/employee/tests/${test.id}/take`,
      variant: "default",
    }
  }

  if (test.status === "failed") {
    return {
      label: "Review",
      href: `/employee/tests/${test.id}/result`,
      variant: "outline",
    }
  }

  return {
    label: "View Results",
    href: `/employee/tests/${test.id}/result`,
    variant: "outline",
  }
}

export function formatPassFailStatus(score: number | null, passed: boolean | null): string | null {
  if (score === null || passed === null) return null
  return passed ? "Passed" : "Failed"
}
