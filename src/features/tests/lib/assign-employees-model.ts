import { formatTestDate } from "@/features/tests/lib/test-format"
import type { AppLocale } from "@/shared/i18n/locale-config"
import type { createTranslator } from "@/shared/i18n/translate"
import type { TranslationKey } from "@/shared/i18n/translate"
import type {
  AssignableEmployee,
  TestAssignmentStatus,
  TestEmployeeAssignment,
} from "@/features/tests/types/assignment"

export type EmployeeFilter = "all" | "not_assigned" | "in_progress" | "completed" | "at_risk"

const EMPLOYEE_FILTER_LABEL_KEYS: Record<EmployeeFilter, TranslationKey> = {
  all: "common.all",
  not_assigned: "dataTable.filters.notAssigned",
  in_progress: "dataTable.filters.inProgress",
  completed: "dataTable.completed",
  at_risk: "dataTable.filters.atRisk",
}

export function getEmployeeFilterOptions(
  t: ReturnType<typeof createTranslator>["t"]
): Array<{ label: string; value: EmployeeFilter }> {
  return (Object.keys(EMPLOYEE_FILTER_LABEL_KEYS) as EmployeeFilter[]).map((value) => ({
    value,
    label: t(EMPLOYEE_FILTER_LABEL_KEYS[value]),
  }))
}

export interface EmployeeWithAssignmentStatus extends AssignableEmployee {
  assignmentStatus: TestAssignmentStatus | "not_assigned"
}

export interface AssignmentSettings {
  deadline: string
  note: string
  reminderEnabled: boolean
}

export interface AssignmentSummary {
  selectedCount: number
  alreadyAssignedCount: number
  newAssignmentsCount: number
}

function getAssignmentForEmployee(
  assignments: TestEmployeeAssignment[],
  testId: string,
  employeeId: string
): TestEmployeeAssignment | undefined {
  return assignments.find((item) => item.testId === testId && item.employeeId === employeeId)
}

export function getDefaultDeadline(): string {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

export function getDefaultAssignmentSettings(): AssignmentSettings {
  return {
    deadline: getDefaultDeadline(),
    note: "",
    reminderEnabled: false,
  }
}

export function enrichEmployeesWithAssignmentStatus(
  employees: AssignableEmployee[],
  assignments: TestEmployeeAssignment[],
  testId: string
): EmployeeWithAssignmentStatus[] {
  return employees.map((employee) => {
    const assignment = getAssignmentForEmployee(assignments, testId, employee.id)
    return {
      ...employee,
      assignmentStatus: assignment?.status ?? "not_assigned",
    }
  })
}

export function filterEmployees(
  employees: EmployeeWithAssignmentStatus[],
  filter: EmployeeFilter
): EmployeeWithAssignmentStatus[] {
  switch (filter) {
    case "not_assigned":
      return employees.filter((employee) => employee.assignmentStatus === "not_assigned")
    case "in_progress":
      return employees.filter((employee) => employee.assignmentStatus === "in_progress")
    case "completed":
      return employees.filter((employee) => employee.assignmentStatus === "completed")
    case "at_risk":
      return employees.filter((employee) => employee.riskLevel === "at_risk")
    default:
      return employees
  }
}

export function buildAssignmentSummary(
  selectedEmployeeIds: string[],
  assignments: TestEmployeeAssignment[],
  testId: string
): AssignmentSummary {
  const alreadyAssignedCount = selectedEmployeeIds.filter(
    (employeeId) => getAssignmentForEmployee(assignments, testId, employeeId) !== undefined
  ).length

  return {
    selectedCount: selectedEmployeeIds.length,
    alreadyAssignedCount,
    newAssignmentsCount: selectedEmployeeIds.length - alreadyAssignedCount,
  }
}

export function formatAssignmentDeadline(
  locale: AppLocale,
  deadline: string,
  t: ReturnType<typeof createTranslator>["t"]
): string {
  if (!deadline) return t("common.notSet")
  return formatTestDate(locale, deadline)
}

export function canConfirmAssignment(selectedCount: number, deadline: string): boolean {
  return selectedCount > 0 && deadline.length > 0
}

const ASSIGNMENT_STATUS_LABEL_KEYS: Record<TestAssignmentStatus | "not_assigned", TranslationKey> =
  {
    not_assigned: "status.assignment.notAssigned",
    not_started: "status.assignment.notStarted",
    in_progress: "status.assignment.inProgress",
    completed: "status.assignment.completed",
    failed: "status.assignment.failed",
  }

export function formatAssignmentStatus(
  status: TestAssignmentStatus | "not_assigned",
  t: ReturnType<typeof createTranslator>["t"]
): string {
  return t(ASSIGNMENT_STATUS_LABEL_KEYS[status])
}
