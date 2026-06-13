import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import type { EmployeeSafeQuestion } from "@/features/employee/tests/lib/supabase-employee-tests"
import type { TestQuestion } from "@/features/tests/mock/tests"

export type TestTakingAnswers = Record<string, string>
export type SupabaseTestTakingAnswers = Record<string, string[] | string>

export type MockEmployeeTakeableTest = EmployeeAssignedTest & {
  source?: "mock"
  questions: TestQuestion[]
}

export type SupabaseEmployeeTakeableTest = EmployeeAssignedTest & {
  source: "supabase"
  questions: EmployeeSafeQuestion[]
}

export type EmployeeTakeableTest = MockEmployeeTakeableTest | SupabaseEmployeeTakeableTest

export function isSupabaseTakeableTest(
  test: EmployeeTakeableTest
): test is SupabaseEmployeeTakeableTest {
  return test.source === "supabase"
}

export interface TestTakingProgress {
  answeredCount: number
  unansweredCount: number
  completionPercent: number
}

export interface LocalTestScore {
  score: number
  passed: boolean
  correctCount: number
  totalQuestions: number
}

export function isQuestionAnswered(answers: TestTakingAnswers, questionId: string): boolean {
  const answer = answers[questionId]
  return typeof answer === "string" && answer.length > 0
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

export function getTestTakingProgress(
  questions: TestQuestion[],
  answers: TestTakingAnswers
): TestTakingProgress {
  const answeredCount = questions.filter((question) =>
    isQuestionAnswered(answers, question.id)
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

export function calculateLocalTestScore(
  questions: TestQuestion[],
  answers: TestTakingAnswers,
  passingScore: number
): LocalTestScore {
  const totalQuestions = questions.length

  if (totalQuestions === 0) {
    return { score: 0, passed: false, correctCount: 0, totalQuestions: 0 }
  }

  const correctCount = questions.reduce((count, question) => {
    const selected = answers[question.id]
    if (!selected) return count
    return selected === question.correctAnswer ? count + 1 : count
  }, 0)

  const score = Math.round((correctCount / totalQuestions) * 100)

  return {
    score,
    passed: score >= passingScore,
    correctCount,
    totalQuestions,
  }
}

export function formatTestQuestionType(type: TestQuestion["type"]): string {
  switch (type) {
    case "single_choice":
      return "Single choice"
    case "multiple_choice":
      return "Multiple choice"
    case "true_false":
      return "True / false"
  }
}
