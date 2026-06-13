import type { ReviewQuestion } from "@/features/tests/mock/generated-test-review"
import type { PatchReviewQuestionsRequest } from "@/features/tests/schemas/review-question-schema"

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error
  }

  return fallback
}

export async function patchReviewQuestions(
  testId: string,
  body: PatchReviewQuestionsRequest
): Promise<{ upserted: Array<{ clientId?: string; id: string }>; deletedIds: string[] }> {
  const response = await fetch(`/api/admin/tests/${testId}/questions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to save review question changes"))
  }

  return payload as { upserted: Array<{ clientId?: string; id: string }>; deletedIds: string[] }
}

export async function regenerateReviewQuestion(
  testId: string,
  questionId: string
): Promise<ReviewQuestion> {
  const response = await fetch(`/api/admin/tests/${testId}/questions/${questionId}/regenerate`, {
    method: "POST",
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to regenerate question"))
  }

  const parsed = payload as { question: ReviewQuestion }
  return parsed.question
}
