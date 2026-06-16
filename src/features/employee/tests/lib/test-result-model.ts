import type { PersistedFollowUpState } from "@/features/employee/tests/lib/supabase-employee-follow-ups"
import type { AppLocale } from "@/shared/i18n/locale-config"
import { createTranslator } from "@/shared/i18n/translate"

export type TestResultStatus = "passed" | "failed"

export interface AnswerReviewItem {
  questionId: string
  questionText: string
  employeeAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  topic: string
  sourceChunkReference: string
}

export interface ResultWeakTopic {
  topic: string
  missedQuestionsCount: number
  explanation: string
  recommendedAction: string
}

export interface ResultAiFeedback {
  performanceSummary: string
  understoodWell: string
  needsImprovement: string
  recommendedNextStep: string
}

export interface EmployeeTestResult {
  id: string
  attemptId?: string
  title: string
  description: string
  sourceDocument: string
  sourceDocumentId: string
  passingScore: number
  score: number
  passed: boolean
  status: TestResultStatus
  completedDate: string
  timeSpentMinutes: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  answerReview: AnswerReviewItem[]
  weakTopics: ResultWeakTopic[]
  aiFeedback: ResultAiFeedback
  canRetake?: boolean
  retakeDisabledReason?: string
  attemptCount?: number
  maxAttempts?: number
  followUpsByOriginalQuestionId?: Record<string, PersistedFollowUpState>
}

export function formatTestResultTimeSpent(locale: AppLocale, minutes: number): string {
  const { t } = createTranslator(locale)

  if (minutes < 60) {
    return minutes === 1
      ? t("employee.format.timeSpentMinute")
      : t("employee.format.timeSpentMinutes", { minutes })
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return hours === 1
      ? t("employee.format.timeSpentHour")
      : t("employee.format.timeSpentHours", { hours })
  }

  return t("employee.format.timeSpentHoursMinutes", { hours, minutes: remainingMinutes })
}
