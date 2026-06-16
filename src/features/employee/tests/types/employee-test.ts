import type { TestAssignmentStatus } from "@/features/tests/types/assignment"
import type { TestDifficulty } from "@/features/tests/types/test"

export interface EmployeeAssignmentRecord {
  testId: string
  status: TestAssignmentStatus
  deadline: string | null
  estimatedMinutes: number
  required: boolean
  progressPercent: number
  score: number | null
  passed: boolean | null
}

export interface EmployeeAssignedTest {
  assignmentId?: string
  latestAttemptId?: string
  id: string
  title: string
  description: string
  status: TestAssignmentStatus
  sourceDocument: string
  difficulty: TestDifficulty
  questionCount: number
  passingScore: number
  deadline: string | null
  estimatedMinutes: number
  score: number | null
  passed: boolean | null
  attemptCount?: number
  maxAttempts?: number
  canRetake?: boolean
  required: boolean
  progressPercent: number
  testIsActive?: boolean
  sourceValidity?: string
  sourceInvalidReason?: string | null
}
