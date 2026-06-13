import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject, JSONParseError, NoObjectGeneratedError, TypeValidationError } from "ai"

import {
  AttemptFeedbackLlmSchema,
  AttemptFeedbackOutputSchema,
  type AttemptFeedbackOutput,
} from "@/features/employee/tests/schemas/attempt-feedback-schema"

export const ATTEMPT_FEEDBACK_MODEL = "gpt-4.1-mini"
export const ATTEMPT_FEEDBACK_TIMEOUT_MS = 15_000

export type AttemptFeedbackAnswerInput = {
  questionText: string
  topic: string
  isCorrect: boolean
  employeeAnswer: string
  correctAnswer: string
  explanation: string
}

export type AttemptFeedbackInput = {
  testTitle: string
  testDescription?: string | null
  score: number
  passed: boolean
  passingScore: number
  answers: AttemptFeedbackAnswerInput[]
}

function getAttemptFeedbackModel(): string {
  return process.env.ATTEMPT_FEEDBACK_MODEL?.trim() || ATTEMPT_FEEDBACK_MODEL
}

function getAttemptFeedbackTimeoutMs(): number {
  const parsed = Number(process.env.ATTEMPT_FEEDBACK_TIMEOUT_MS)

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return ATTEMPT_FEEDBACK_TIMEOUT_MS
}

function isAttemptFeedbackTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    error.message.toLowerCase().includes("timeout") ||
    error.message.toLowerCase().includes("aborted")
  )
}

function buildAttemptFeedbackPrompt(input: AttemptFeedbackInput): string {
  const incorrectAnswers = input.answers.filter((item) => !item.isCorrect)
  const correctAnswers = input.answers.filter((item) => item.isCorrect)

  const answerLines = input.answers.map((item, index) => {
    const status = item.isCorrect ? "correct" : "incorrect"
    return [
      `${index + 1}. [${status}] Topic: ${item.topic}`,
      `   Question: ${item.questionText}`,
      `   Employee answer: ${item.employeeAnswer}`,
      `   Correct answer: ${item.correctAnswer}`,
      item.explanation ? `   Explanation: ${item.explanation}` : null,
    ]
      .filter(Boolean)
      .join("\n")
  })

  const allCorrect = incorrectAnswers.length === 0
  const allWrong = correctAnswers.length === 0

  return [
    "You are an expert learning coach writing personalized feedback after an employee knowledge test.",
    "",
    "Write feedback grounded only in the provided test results. Reference specific topics and mistakes.",
    "",
    "Rules:",
    "- performanceSummary: 1-2 sentences on overall result (score, pass/fail, test title).",
    "- understoodWell: name specific topics or question areas the employee answered correctly.",
    "- needsImprovement: name specific missed topics or mistakes; reference actual wrong answers when relevant.",
    "- recommendedNextStep: one concrete next action (what to review, in which topic order).",
    "- Do not use generic phrases like 'try again' or 'study harder' without naming topics.",
    allCorrect
      ? "- All answers were correct: praise strengths only; do not invent weaknesses or missed topics."
      : null,
    allWrong
      ? "- All answers were wrong: address specific topics from the missed questions; stay constructive and specific."
      : null,
    incorrectAnswers.length > 0 && !allWrong
      ? `- Focus improvement feedback on these missed topics: ${[...new Set(incorrectAnswers.map((item) => item.topic))].join(", ")}.`
      : null,
    "",
    `Test: ${input.testTitle}`,
    input.testDescription?.trim() ? `Description: ${input.testDescription.trim()}` : null,
    `Score: ${input.score}% (passing threshold: ${input.passingScore}%)`,
    `Result: ${input.passed ? "passed" : "did not pass"}`,
    "",
    "Question-by-question results:",
    answerLines.join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n")
}

export function isAttemptFeedbackOutputError(error: unknown): boolean {
  return (
    error instanceof JSONParseError ||
    error instanceof NoObjectGeneratedError ||
    error instanceof TypeValidationError
  )
}

export async function generateAttemptFeedback(
  input: AttemptFeedbackInput
): Promise<AttemptFeedbackOutput> {
  const result = await generateObject({
    model: openai(getAttemptFeedbackModel()),
    schema: AttemptFeedbackLlmSchema,
    prompt: buildAttemptFeedbackPrompt(input),
    abortSignal: AbortSignal.timeout(getAttemptFeedbackTimeoutMs()),
  })

  const validated = AttemptFeedbackOutputSchema.safeParse(result.object)

  if (!validated.success) {
    throw new Error(
      validated.error.issues.map((issue) => issue.message).join("; ") ||
        "Attempt feedback output failed validation"
    )
  }

  return validated.data
}

export async function generateAttemptFeedbackBestEffort(
  input: AttemptFeedbackInput
): Promise<AttemptFeedbackOutput | null> {
  try {
    return await generateAttemptFeedback(input)
  } catch (error) {
    if (isAttemptFeedbackTimeoutError(error)) {
      console.warn(`Attempt feedback generation timed out after ${getAttemptFeedbackTimeoutMs()}ms`)
      return null
    }

    console.warn("Attempt feedback generation failed:", error)
    return null
  }
}
