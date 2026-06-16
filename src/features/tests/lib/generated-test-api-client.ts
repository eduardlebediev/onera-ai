import type {
  GenerateTestRequestInput,
  GeneratedTestResponse,
} from "@/features/tests/schemas/generated-test-schema"
import { GeneratedTestResponseSchema } from "@/features/tests/schemas/generated-test-schema"

const CONTEXT_ERROR_MESSAGE =
  "Could not generate the test draft. Please check that the selected documents are ready and have embedded chunks, then try again."
const DEFAULT_ERROR_MESSAGE =
  "Could not generate the test draft. The AI output did not pass validation, so please try again."

function getFriendlyErrorMessage(status: number, serverMessage?: string): string {
  if (status === 400) {
    return (
      serverMessage?.trim() || "Invalid generation settings. Please review the form and try again."
    )
  }

  if (status === 404) {
    return "Document not found. This document may not exist in the backend yet."
  }

  if (status === 422) {
    if (
      serverMessage?.toLowerCase().includes("embedded chunks") ||
      serverMessage?.toLowerCase().includes("insufficient context")
    ) {
      return CONTEXT_ERROR_MESSAGE
    }

    if (serverMessage?.trim()) {
      return serverMessage
    }

    return DEFAULT_ERROR_MESSAGE
  }

  if (status === 500) {
    return DEFAULT_ERROR_MESSAGE
  }

  return DEFAULT_ERROR_MESSAGE
}

export async function generateTestFromDocument(
  input: GenerateTestRequestInput
): Promise<GeneratedTestResponse> {
  const response = await fetch("/api/admin/generate-test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const serverMessage =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : undefined

    throw new Error(getFriendlyErrorMessage(response.status, serverMessage))
  }

  const parsed = GeneratedTestResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return parsed.data
}
