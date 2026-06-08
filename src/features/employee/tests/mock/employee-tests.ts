import { resolveMockTest } from "@/features/tests/lib/test-source-document"
import type { TestAssignmentStatus } from "@/features/tests/mock/employees"
import { mockEmployees } from "@/features/tests/mock/employees"
import { getMockTestById, type TestDifficulty } from "@/features/tests/mock/tests"

export const CURRENT_EMPLOYEE_ID = "emp-6"

export interface EmployeeAssignmentRecord {
  testId: string
  status: TestAssignmentStatus
  deadline: string
  estimatedMinutes: number
  required: boolean
  progressPercent: number
  score: number | null
  passed: boolean | null
}

export interface EmployeeAssignedTest {
  id: string
  title: string
  description: string
  status: TestAssignmentStatus
  sourceDocument: string
  difficulty: TestDifficulty
  questionCount: number
  passingScore: number
  deadline: string
  estimatedMinutes: number
  score: number | null
  passed: boolean | null
  required: boolean
  progressPercent: number
}

const mockCurrentEmployeeAssignments: EmployeeAssignmentRecord[] = [
  {
    testId: "test-1",
    status: "not_started",
    deadline: "2026-06-05",
    estimatedMinutes: 15,
    required: true,
    progressPercent: 0,
    score: null,
    passed: null,
  },
  {
    testId: "test-2",
    status: "in_progress",
    deadline: "2026-06-10",
    estimatedMinutes: 12,
    required: true,
    progressPercent: 65,
    score: null,
    passed: null,
  },
  {
    testId: "test-5",
    status: "failed",
    deadline: "2026-05-15",
    estimatedMinutes: 10,
    required: false,
    progressPercent: 100,
    score: 67,
    passed: false,
  },
]

export function getCurrentEmployee() {
  const employee = mockEmployees.find((item) => item.id === CURRENT_EMPLOYEE_ID)
  if (!employee) {
    throw new Error(`Mock employee ${CURRENT_EMPLOYEE_ID} not found`)
  }
  return employee
}

function buildAssignedTest(record: EmployeeAssignmentRecord): EmployeeAssignedTest | null {
  const test = getMockTestById(record.testId)
  if (!test) return null

  const resolved = resolveMockTest(test)

  return {
    id: test.id,
    title: test.title,
    description: test.description,
    status: record.status,
    sourceDocument: resolved.sourceDocument.title,
    difficulty: test.difficulty,
    questionCount: test.questionCount,
    passingScore: test.passingScore,
    deadline: record.deadline,
    estimatedMinutes: record.estimatedMinutes,
    score: record.score,
    passed: record.passed,
    required: record.required,
    progressPercent: record.progressPercent,
  }
}

export function getEmployeeAssignedTests(): EmployeeAssignedTest[] {
  return mockCurrentEmployeeAssignments
    .map(buildAssignedTest)
    .filter((item): item is EmployeeAssignedTest => item !== null)
}
