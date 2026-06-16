export type TestAssignmentStatus = "not_started" | "in_progress" | "completed" | "failed"

export type EmployeeRiskLevel = "on_track" | "at_risk"

export interface AssignableEmployee {
  id: string
  name: string
  email: string
  role: string
  department: string
  completedTestsCount: number
  averageScore: number
  riskLevel: EmployeeRiskLevel
}

export interface TestEmployeeAssignment {
  testId: string
  employeeId: string
  status: TestAssignmentStatus
}
