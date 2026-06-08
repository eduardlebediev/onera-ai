export type TestAssignmentStatus = "not_started" | "in_progress" | "completed" | "failed"

export type EmployeeRiskLevel = "on_track" | "at_risk"

export interface MockEmployee {
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

export const mockEmployees: MockEmployee[] = [
  {
    id: "emp-1",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    role: "Software Engineer",
    department: "Engineering",
    completedTestsCount: 4,
    averageScore: 82,
    riskLevel: "on_track",
  },
  {
    id: "emp-2",
    name: "Marcus Webb",
    email: "marcus.webb@company.com",
    role: "Support Agent",
    department: "Customer Support",
    completedTestsCount: 2,
    averageScore: 58,
    riskLevel: "at_risk",
  },
  {
    id: "emp-3",
    name: "Elena Rodriguez",
    email: "elena.rodriguez@company.com",
    role: "HR Coordinator",
    department: "Human Resources",
    completedTestsCount: 5,
    averageScore: 91,
    riskLevel: "on_track",
  },
  {
    id: "emp-4",
    name: "James Okonkwo",
    email: "james.okonkwo@company.com",
    role: "Operations Specialist",
    department: "Operations",
    completedTestsCount: 3,
    averageScore: 74,
    riskLevel: "on_track",
  },
  {
    id: "emp-5",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    role: "Support Agent",
    department: "Customer Support",
    completedTestsCount: 6,
    averageScore: 88,
    riskLevel: "on_track",
  },
  {
    id: "emp-6",
    name: "Alex Turner",
    email: "alex.turner@company.com",
    role: "Support Agent",
    department: "Customer Support",
    completedTestsCount: 1,
    averageScore: 52,
    riskLevel: "at_risk",
  },
  {
    id: "emp-7",
    name: "Nina Patel",
    email: "nina.patel@company.com",
    role: "Product Analyst",
    department: "Product",
    completedTestsCount: 3,
    averageScore: 79,
    riskLevel: "on_track",
  },
  {
    id: "emp-8",
    name: "David Kim",
    email: "david.kim@company.com",
    role: "New Hire",
    department: "Engineering",
    completedTestsCount: 0,
    averageScore: 0,
    riskLevel: "on_track",
  },
  {
    id: "emp-9",
    name: "Olivia Grant",
    email: "olivia.grant@company.com",
    role: "Compliance Officer",
    department: "Legal & Compliance",
    completedTestsCount: 7,
    averageScore: 85,
    riskLevel: "on_track",
  },
  {
    id: "emp-10",
    name: "Ryan Foster",
    email: "ryan.foster@company.com",
    role: "Team Lead",
    department: "Operations",
    completedTestsCount: 4,
    averageScore: 63,
    riskLevel: "at_risk",
  },
]

export const mockTestEmployeeAssignments: TestEmployeeAssignment[] = [
  { testId: "test-1", employeeId: "emp-1", status: "completed" },
  { testId: "test-1", employeeId: "emp-2", status: "failed" },
  { testId: "test-1", employeeId: "emp-3", status: "completed" },
  { testId: "test-1", employeeId: "emp-4", status: "in_progress" },
  { testId: "test-1", employeeId: "emp-5", status: "completed" },
  { testId: "test-1", employeeId: "emp-6", status: "in_progress" },
  { testId: "test-1", employeeId: "emp-7", status: "not_started" },
  { testId: "test-1", employeeId: "emp-8", status: "not_started" },
  { testId: "test-2", employeeId: "emp-4", status: "completed" },
  { testId: "test-2", employeeId: "emp-5", status: "completed" },
  { testId: "test-2", employeeId: "emp-6", status: "in_progress" },
  { testId: "test-2", employeeId: "emp-9", status: "completed" },
  { testId: "test-2", employeeId: "emp-10", status: "in_progress" },
  { testId: "test-2", employeeId: "emp-1", status: "not_started" },
  { testId: "test-2", employeeId: "emp-3", status: "not_started" },
  { testId: "test-2", employeeId: "emp-7", status: "not_started" },
  { testId: "test-5", employeeId: "emp-6", status: "completed" },
  { testId: "test-5", employeeId: "emp-7", status: "completed" },
  { testId: "test-5", employeeId: "emp-1", status: "failed" },
  { testId: "test-5", employeeId: "emp-2", status: "completed" },
  { testId: "test-5", employeeId: "emp-5", status: "completed" },
  { testId: "test-5", employeeId: "emp-10", status: "completed" },
]

export function getAssignmentForEmployee(
  assignments: TestEmployeeAssignment[],
  testId: string,
  employeeId: string
): TestEmployeeAssignment | undefined {
  return assignments.find((item) => item.testId === testId && item.employeeId === employeeId)
}

export function getAssignmentsForTest(
  assignments: TestEmployeeAssignment[],
  testId: string
): TestEmployeeAssignment[] {
  return assignments.filter((item) => item.testId === testId)
}
