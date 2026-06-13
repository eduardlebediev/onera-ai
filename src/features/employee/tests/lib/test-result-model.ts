import {
  getEmployeeAssignedTestById,
  type EmployeeAssignedTest,
} from "@/features/employee/tests/mock/employee-tests"
import {
  getEmployeeTestAttemptByTestId,
  type ResultAiFeedbackRecord,
  type ResultWeakTopicRecord,
} from "@/features/employee/tests/mock/test-results"
import { loadTakeSession } from "@/features/employee/tests/lib/take-session"
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

function buildWeakTopicsFromReview(answerReview: AnswerReviewItem[]): ResultWeakTopic[] {
  const incorrectByTopic = new Map<string, AnswerReviewItem[]>()

  for (const item of answerReview) {
    if (item.isCorrect) continue
    const existing = incorrectByTopic.get(item.topic) ?? []
    existing.push(item)
    incorrectByTopic.set(item.topic, existing)
  }

  return Array.from(incorrectByTopic.entries()).map(([topic, items]) => ({
    topic,
    missedQuestionsCount: items.length,
    explanation: items[0]?.explanation ?? `Review the ${topic} section in the source document.`,
    recommendedAction: `Review the ${topic} section and try a follow-up question if available.`,
  }))
}

function buildDynamicAiFeedback(
  testTitle: string,
  score: number,
  passed: boolean,
  answerReview: AnswerReviewItem[]
): ResultAiFeedback {
  const correctItems = answerReview.filter((item) => item.isCorrect)
  const incorrectItems = answerReview.filter((item) => !item.isCorrect)
  const understoodTopics = [...new Set(correctItems.map((item) => item.topic))].slice(0, 2)
  const weakTopicNames = [...new Set(incorrectItems.map((item) => item.topic))]

  return {
    performanceSummary: passed
      ? `You scored ${score}% and passed the ${testTitle}.`
      : `You scored ${score}% and did not meet the passing threshold on the ${testTitle}.`,
    understoodWell:
      correctItems.length > 0
        ? `You answered ${correctItems.length} question${correctItems.length === 1 ? "" : "s"} correctly${understoodTopics.length > 0 ? `, including topics like ${understoodTopics.join(" and ")}` : ""}.`
        : "Focus on reviewing the source document sections linked to each question.",
    needsImprovement:
      incorrectItems.length > 0
        ? `You missed ${incorrectItems.length} question${incorrectItems.length === 1 ? "" : "s"}${weakTopicNames.length > 0 ? `, especially in ${weakTopicNames.join(" and ")}` : ""}.`
        : "No incorrect answers in this attempt.",
    recommendedNextStep:
      incorrectItems.length > 0
        ? "Review your incorrect answers below and use Check Understanding on any weak topics."
        : "Great work — revisit the source document periodically to keep knowledge fresh.",
  }
}

function buildEmployeeTestResult(
  assignedTest: EmployeeAssignedTest,
  testId: string,
  answersOverride?: Record<string, string>
): EmployeeTestResult | null {
  const test = getMockTestById(testId)
  if (!test) return null

  const resolved = resolveMockTest(test)
  const sessionRecord = answersOverride ? null : loadTakeSession(testId)
  const employeeAnswers =
    answersOverride ??
    sessionRecord?.answers ??
    getEmployeeTestAttemptByTestId(testId)?.employeeAnswers

  if (!employeeAnswers) return null

  const answerReview = test.questions.map((question) =>
    buildAnswerReviewItem(question, employeeAnswers[question.id] ?? "—")
  )
  const totalQuestions = answerReview.length
  const correctCount = answerReview.filter((item) => item.isCorrect).length
  const wrongCount = totalQuestions - correctCount
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100)
  const passed = score >= assignedTest.passingScore

  const staticAttempt = getEmployeeTestAttemptByTestId(testId)
  const useStaticMetadata = !answersOverride && !sessionRecord?.answers && staticAttempt

  const weakTopics = useStaticMetadata
    ? staticAttempt.weakTopics
    : buildWeakTopicsFromReview(answerReview)

  const aiFeedback = useStaticMetadata
    ? staticAttempt.aiFeedback
    : buildDynamicAiFeedback(assignedTest.title, score, passed, answerReview)

  const completedDate =
    sessionRecord?.submittedAt?.slice(0, 10) ??
    staticAttempt?.completedDate ??
    new Date().toISOString().slice(0, 10)

  const timeSpentMinutes = sessionRecord?.timeSpentMinutes ?? staticAttempt?.timeSpentMinutes ?? 10

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
    completedDate,
    timeSpentMinutes,
    totalQuestions,
    correctCount,
    wrongCount,
    answerReview,
    weakTopics,
    aiFeedback,
  }
}

export function getEmployeeTestResult(
  testId: string,
  answersOverride?: Record<string, string>
): EmployeeTestResult | null {
  const assignedTest = getEmployeeAssignedTestById(testId)
  if (!assignedTest) return null

  return buildEmployeeTestResult(assignedTest, testId, answersOverride)
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
