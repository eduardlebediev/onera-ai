import { formatTestDate } from "@/features/tests/lib/test-format"
import type {
  AssignableEmployee,
  TestAssignmentStatus,
  TestEmployeeAssignment,
} from "@/features/tests/types/assignment"

export type EmployeeFilter = "all" | "not_assigned" | "in_progress" | "completed" | "at_risk"

export const EMPLOYEE_FILTER_OPTIONS: Array<{ label: string; value: EmployeeFilter }> = [
  { label: "All", value: "all" },
  { label: "Not assigned", value: "not_assigned" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "At risk", value: "at_risk" },
]

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

export function formatAssignmentDeadline(deadline: string): string {
  if (!deadline) return "Not set"
  return formatTestDate(deadline)
}

export function canConfirmAssignment(selectedCount: number, deadline: string): boolean {
  return selectedCount > 0 && deadline.length > 0
}

export function formatAssignmentStatus(status: TestAssignmentStatus | "not_assigned"): string {
  switch (status) {
    case "not_assigned":
      return "Not assigned"
    case "not_started":
      return "Not started"
    case "in_progress":
      return "In progress"
    case "completed":
      return "Completed"
    case "failed":
      return "Failed"
  }
}
