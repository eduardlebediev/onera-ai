import {
  getEmployeeAssignedTestById,
  type EmployeeAssignedTest,
} from "@/features/employee/tests/mock/employee-tests"
import {
  getEmployeeTestAttemptByTestId,
  type ResultAiFeedbackRecord,
  type ResultWeakTopicRecord,
} from "@/features/employee/tests/mock/test-results"
import { resolveMockTest } from "@/features/tests/lib/test-source-document"
import { getMockTestById, type TestQuestion } from "@/features/tests/mock/tests"

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

export type ResultWeakTopic = ResultWeakTopicRecord

export type ResultAiFeedback = ResultAiFeedbackRecord

export interface EmployeeTestResult {
  id: string
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
}

function buildAnswerReviewItem(question: TestQuestion, employeeAnswer: string): AnswerReviewItem {
  const isCorrect = employeeAnswer === question.correctAnswer

  return {
    questionId: question.id,
    questionText: question.questionText,
    employeeAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    explanation: question.explanation,
    topic: question.topic,
    sourceChunkReference: question.sourceChunkReference,
  }
}

function buildEmployeeTestResult(
  assignedTest: EmployeeAssignedTest,
  testId: string
): EmployeeTestResult | null {
  const attempt = getEmployeeTestAttemptByTestId(testId)
  if (!attempt) return null

  const test = getMockTestById(testId)
  if (!test) return null

  const resolved = resolveMockTest(test)
  const answerReview = test.questions.map((question) =>
    buildAnswerReviewItem(question, attempt.employeeAnswers[question.id] ?? "—")
  )
  const totalQuestions = answerReview.length
  const correctCount = answerReview.filter((item) => item.isCorrect).length
  const wrongCount = totalQuestions - correctCount
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100)
  const passed = score >= assignedTest.passingScore

  return {
    id: assignedTest.id,
    title: assignedTest.title,
    description: assignedTest.description,
    sourceDocument: resolved.sourceDocument.title,
    sourceDocumentId: resolved.sourceDocument.documentId,
    passingScore: assignedTest.passingScore,
    score,
    passed,
    status: passed ? "passed" : "failed",
    completedDate: attempt.completedDate,
    timeSpentMinutes: attempt.timeSpentMinutes,
    totalQuestions,
    correctCount,
    wrongCount,
    answerReview,
    weakTopics: attempt.weakTopics,
    aiFeedback: attempt.aiFeedback,
  }
}

export function getEmployeeTestResult(testId: string): EmployeeTestResult | null {
  const assignedTest = getEmployeeAssignedTestById(testId)
  if (!assignedTest) return null

  return buildEmployeeTestResult(assignedTest, testId)
}

export function formatTestResultTimeSpent(minutes: number): string {
  if (minutes < 60) {
    return minutes === 1 ? "1 min" : `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hr" : `${hours} hr`
  }

  return `${hours} hr ${remainingMinutes} min`
}
