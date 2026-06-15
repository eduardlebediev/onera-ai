import "server-only"

import type { Json } from "@/lib/supabase/types"

export type StartAttemptResult = {
  attemptId: string
  testId: string
}

export type SubmitAnswerInput = {
  questionId: string
  selectedOptionIds?: string[]
  openText?: string
}

export type SubmitAttemptResult = {
  attemptId: string
  score: number
  passed: boolean
  redirectTo: string
}

export type AttemptRow = {
  id: string
  organization_id: string
  test_id: string
  user_id: string
  assignment_id: string | null
  status: string
  score: number | null
  passed: boolean | null
  ai_feedback: string | null
  started_at: string | null
  completed_at: string | null
}

export type TestAttemptPolicyRow = {
  id: string
  organization_id: string
  status: string
  is_active: boolean | null
  source_validity: string | null
  max_attempts: number | null
}

export type QuestionScoringRow = {
  id: string
  question_text: string
  question_type: string
  options: Json
  correct_answer: Json
  explanation: string | null
  topic: string | null
  source_chunk_id: string | null
}

export type AnswerRow = {
  id: string
  question_id: string
  user_answer: Json
  is_correct: boolean | null
}

export type ResultTestRow = {
  id: string
  title: string
  description: string | null
  passing_score: number
  source_document_id: string | null
  status: string
  is_active: boolean | null
  source_validity: string | null
  max_attempts: number | null
}

export {
  StartAttemptError,
  startEmployeeTestAttempt,
  type StartAttemptErrorCode,
} from "./create-attempt"
export {
  SubmitAttemptError,
  submitEmployeeTestAttempt,
  type SubmitAttemptErrorCode,
} from "./submit-attempt"
export {
  getLatestCompletedAttemptIdForAssignment,
  getPersistedEmployeeTestResult,
} from "./attempt-result"
