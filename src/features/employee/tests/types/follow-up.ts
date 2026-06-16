export type FollowUpDifficulty = "easy" | "medium" | "hard"

export type FollowUpTopicStatus = "needs_review" | "follow_up_completed" | "topic_understood"

export interface FollowUpQuestionOption {
  id: string
  label: string
}

export interface FollowUpQuestion {
  id: string
  originalQuestionId: string
  topic: string
  sourceChunkReference: string
  explanationBeforeQuestion: string
  questionText: string
  options: FollowUpQuestionOption[]
  correctOptionId?: string
  explanationAfterAnswer: string
  learningGoal: string
  difficulty: FollowUpDifficulty
}
