"use client"

import type { FollowUpQuestion } from "@/features/employee/tests/mock/follow-up-questions"
import {
  FollowUpQuestionOutputSchema,
  type GenerateFollowUpQuestionRequest,
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

  const parsed = FollowUpQuestionOutputSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Could not generate question. Try again.")
  }

  return parsed.data
}
