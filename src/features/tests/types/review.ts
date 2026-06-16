import type { QuestionType } from "@/features/tests/schemas/generated-test-schema"

export type ReviewStatus = "needs_review" | "approved" | "rejected" | "edited"
export type ReviewDifficulty = "easy" | "medium" | "hard"
export type ReviewLanguage = "English" | "German"

export interface ReviewQuestion {
  id: string
  dbQuestionId?: string
  clientId?: string
  questionText: string
  questionType: QuestionType
  options: string[]
  correctAnswer: string
  /** When multiple options are correct (e.g. AI multiple_choice). */
  correctAnswers?: string[]
  /** Expected answer text for open-ended questions. */
  expectedAnswer?: string
  explanation: string
  topic: string
  sourceChunkReference: string
  sourceChunkId?: string | null
  sourceDocumentId?: string | null
  sourceDocumentTitle?: string
  testedSkill: string
  pedagogicalGoal: string
  difficulty: ReviewDifficulty
  whyUseful: string
  status: ReviewStatus
  isAiGenerated: boolean
}

export interface TestReviewData {
  testTitle: string
  description?: string
  difficulty: ReviewDifficulty
  targetRole: string
  questionCount: number
  language: ReviewLanguage
  passingScore: number
  selectedChunksCount: number
  selectedTopics: string[]
  sourceDocuments?: Array<{ id: string; title: string }>
  questions: ReviewQuestion[]
}
