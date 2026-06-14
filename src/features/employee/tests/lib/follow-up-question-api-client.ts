"use client"

import type { FollowUpQuestion } from "@/features/employee/tests/mock/follow-up-questions"
import {
  FollowUpQuestionPublicOutputSchema,
  type FollowUpAnswerResult,
  type GenerateFollowUpQuestionRequest,
  SubmitFollowUpAnswerRequestSchema,
  FollowUpAnswerResultSchema,
} from "@/features/employee/tests/schemas/follow-up-question-schema"

type ErrorResponse = {
  error?: string
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function generateFollowUpQuestionForAnswer(
  testId: string,
  request: GenerateFollowUpQuestionRequest
): Promise<FollowUpQuestion> {
  const response = await fetch(`/api/employee/tests/${testId}/follow-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const errorPayload = payload as ErrorResponse | null
    throw new Error(errorPayload?.error || "Could not generate question. Try again.")
  }

  const parsed = FollowUpQuestionPublicOutputSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Could not generate question. Try again.")
  }

  return parsed.data as FollowUpQuestion
}

export async function submitFollowUpAnswerForQuestion(
  testId: string,
  followUpId: string,
  selectedOptionId: string
): Promise<FollowUpAnswerResult> {
  const requestBody = SubmitFollowUpAnswerRequestSchema.parse({ selectedOptionId })

  const response = await fetch(`/api/employee/tests/${testId}/follow-up/${followUpId}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const errorPayload = payload as ErrorResponse | null
    throw new Error(errorPayload?.error || "Could not submit follow-up answer. Try again.")
  }

  const parsed = FollowUpAnswerResultSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Could not submit follow-up answer. Try again.")
  }

  return parsed.data
}
