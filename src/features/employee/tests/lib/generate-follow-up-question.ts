import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject, JSONParseError, NoObjectGeneratedError, TypeValidationError } from "ai"

import {
  FollowUpQuestionLlmSchema,
  FollowUpQuestionOutputSchema,
  type FollowUpQuestionOutput,
} from "@/features/employee/tests/schemas/follow-up-question-schema"

export const FOLLOW_UP_QUESTION_MODEL = "gpt-4.1-mini"
export const FOLLOW_UP_QUESTION_TIMEOUT_MS = 15_000

const OPTION_IDS = ["opt-a", "opt-b", "opt-c", "opt-d"] as const

export class FollowUpQuestionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FollowUpQuestionValidationError"
  }
}

function getFollowUpQuestionModel(): string {
  return process.env.FOLLOW_UP_QUESTION_MODEL?.trim() || FOLLOW_UP_QUESTION_MODEL
}

function getFollowUpQuestionTimeoutMs(): number {
  const parsed = Number(process.env.FOLLOW_UP_QUESTION_TIMEOUT_MS)

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return FOLLOW_UP_QUESTION_TIMEOUT_MS
}

function buildFollowUpQuestionPrompt(input: {
  questionText: string
  topic: string
  explanation: string
}): string {
  return [
    "You are an expert learning coach generating one adaptive follow-up question after an employee answered a knowledge test question incorrectly.",
    "",
    "Generate exactly one single-choice follow-up question that checks whether the employee now understands the same topic.",
    "",
    "Rules:",
    "- Generate exactly 4 answer options.",
    "- Exactly one option must be correct.",
    "- The question must stay grounded in the original question, topic, and explanation.",
    "- Do not mention that you are an AI model.",
    "- Keep the tone clear, practical, and workplace appropriate.",
    "- explanationBeforeQuestion should briefly restate the key concept the employee missed.",
    "- explanationAfterAnswer should explain why the correct option is correct.",
    "",
    `Original question: ${input.questionText}`,
    `Topic: ${input.topic}`,
    `Original explanation: ${input.explanation || "No explanation provided."}`,
  ].join("\n")
}

export function isFollowUpQuestionOutputError(error: unknown): boolean {
  return (
    error instanceof JSONParseError ||
    error instanceof NoObjectGeneratedError ||
    error instanceof TypeValidationError ||
    error instanceof FollowUpQuestionValidationError
  )
}

export function isFollowUpQuestionTimeoutError(error: unknown): boolean {
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

export async function generateFollowUpQuestion(
  questionText: string,
  topic: string,
  explanation: string
): Promise<FollowUpQuestionOutput> {
  const normalizedTopic = topic.trim() || "General"
  const result = await generateObject({
    model: openai(getFollowUpQuestionModel()),
    schema: FollowUpQuestionLlmSchema,
    prompt: buildFollowUpQuestionPrompt({
      questionText: questionText.trim(),
      topic: normalizedTopic,
      explanation: explanation.trim(),
    }),
    abortSignal: AbortSignal.timeout(getFollowUpQuestionTimeoutMs()),
  })

  const mapped = {
    id: "generated-follow-up",
    originalQuestionId: "generated-question",
    topic: normalizedTopic,
    sourceChunkReference: "Source document",
    explanationBeforeQuestion: result.object.explanationBeforeQuestion,
    questionText: result.object.questionText,
    options: result.object.options.map((option, index) => ({
      id: OPTION_IDS[index] ?? `opt-${index + 1}`,
      label: option.label,
    })),
    correctOptionId: OPTION_IDS[result.object.correctOptionIndex],
    explanationAfterAnswer: result.object.explanationAfterAnswer,
    learningGoal: result.object.learningGoal,
    difficulty: result.object.difficulty,
  }

  const validated = FollowUpQuestionOutputSchema.safeParse(mapped)

  if (!validated.success) {
    throw new FollowUpQuestionValidationError(
      validated.error.issues.map((issue) => issue.message).join("; ") ||
        "Follow-up question output failed validation"
    )
  }

  return validated.data
}
