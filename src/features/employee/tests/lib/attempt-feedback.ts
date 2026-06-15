import "server-only"

import {
  generateAttemptFeedbackBestEffort,
  type AttemptFeedbackAnswerInput,
} from "@/features/employee/tests/lib/generate-attempt-feedback"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import {
  parseAttemptFeedbackEnvelope,
  serializeAttemptFeedbackEnvelope,
} from "@/features/employee/tests/schemas/attempt-feedback-schema"
import { createAdminClient } from "@/lib/supabase/admin"

import type { QuestionScoringRow } from "./supabase-employee-attempts"

export function buildAttemptFeedbackInput(
  scoredAnswers: Array<{
    question: QuestionScoringRow
    employeeAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
): AttemptFeedbackAnswerInput[] {
  return scoredAnswers.map((item) => ({
    questionText: item.question.question_text,
    topic: item.question.topic ?? "General",
    isCorrect: item.isCorrect,
    employeeAnswer: item.employeeAnswer,
    correctAnswer: item.correctAnswer,
    explanation: item.question.explanation ?? "",
  }))
}

export function resolveAttemptAiFeedback(
  storedFeedback: string | null | undefined,
  testTitle: string,
  score: number,
  passed: boolean,
  answerReview: EmployeeTestResult["answerReview"]
): EmployeeTestResult["aiFeedback"] {
  const parsed = parseAttemptFeedbackEnvelope(storedFeedback)

  if (parsed) {
    return parsed
  }

  return buildDynamicAiFeedback(testTitle, score, passed, answerReview)
}

export async function persistAttemptFeedbackBestEffort(
  attemptId: string,
  input: Parameters<typeof generateAttemptFeedbackBestEffort>[0]
): Promise<void> {
  const feedback = await generateAttemptFeedbackBestEffort(input)

  if (!feedback) {
    return
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("test_attempts")
    .update({ ai_feedback: serializeAttemptFeedbackEnvelope(feedback) })
    .eq("id", attemptId)

  if (error) {
    console.warn("Failed to persist attempt feedback:", error.message)
  }
}

function buildDynamicAiFeedback(
  testTitle: string,
  score: number,
  passed: boolean,
  answerReview: EmployeeTestResult["answerReview"]
): EmployeeTestResult["aiFeedback"] {
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

export function buildWeakTopicsFromReview(
  answerReview: EmployeeTestResult["answerReview"]
): EmployeeTestResult["weakTopics"] {
  const incorrectByTopic = new Map<string, EmployeeTestResult["answerReview"]>()

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
