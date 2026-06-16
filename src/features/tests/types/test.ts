export type TestStatus = "draft" | "published" | "archived"
export type TestDifficulty = "easy" | "medium" | "hard"
export type TestLanguage = "English" | "German"
export type TestQuestionType = "single_choice" | "multiple_choice" | "true_false"

export interface TestQuestion {
  id: string
  questionText: string
  type: TestQuestionType
  options: string[]
  correctAnswer: string
  explanation: string
  topic: string
  testedSkill: string
  pedagogicalGoal: string
  sourceChunkReference: string
}

export interface TestSourceDocumentRef {
  documentId: string
  topicsUsed: string[]
  chunksUsed: number
}

export interface TestAssignmentsSummary {
  assigned: number
  completed: number
  inProgress: number
  notStarted: number
  failed?: number
}

export interface TestWeakTopic {
  topic: string
  correctnessPct: number
}

export interface TestRecentAttempt {
  id: string
  employeeName: string
  score: number
  passed: boolean
  completedAt: string
}

export interface TestResultsSummary {
  averageScore: number
  passRate: number
  weakTopics: TestWeakTopic[]
  recentAttempts: TestRecentAttempt[]
}

export interface TestListItem {
  id: string
  title: string
  description: string
  status: TestStatus
  difficulty: TestDifficulty
  targetRole: string
  language: TestLanguage
  questionCount: number
  passingScore: number
  selectedTopics: string[]
  selectedChunksCount: number
  createdAt: string
  assignedEmployeesCount: number
  attemptsCount: number
  isActive?: boolean
  sourceValidity?: string
  sourceInvalidReason?: string | null
  sourceDocument: TestSourceDocumentRef
  questions: TestQuestion[]
  assignments: TestAssignmentsSummary
  results: TestResultsSummary
}
