import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import type { EmployeeSafeQuestion } from "@/features/employee/tests/lib/supabase-employee-tests"

export type SupabaseTestTakingAnswers = Record<string, string[] | string>

export type SupabaseEmployeeTakeableTest = EmployeeAssignedTest & {
  source: "supabase"
  questions: EmployeeSafeQuestion[]
}

export interface TestTakingProgress {
  answeredCount: number
  unansweredCount: number
  completionPercent: number
}

export function isSupabaseQuestionAnswered(
  answers: SupabaseTestTakingAnswers,
  questionId: string,
  questionType?: EmployeeSafeQuestion["questionType"]
): boolean {
  const answer = answers[questionId]

  if (questionType === "open_question") {
    return typeof answer === "string" && answer.trim().length > 0
  }

  return Array.isArray(answer) && answer.length > 0
}

export function getSupabaseTestTakingProgress(
  questions: EmployeeSafeQuestion[],
  answers: SupabaseTestTakingAnswers
): TestTakingProgress {
  const answeredCount = questions.filter((question) =>
    isSupabaseQuestionAnswered(answers, question.id, question.questionType)
  ).length
  const totalQuestions = questions.length
  const unansweredCount = totalQuestions - answeredCount
  const completionPercent =
    totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100)

  return {
    answeredCount,
    unansweredCount,
    completionPercent,
  }
}
