import {
  PublishGeneratedTestRequestSchema,
  PublishGeneratedTestResponseSchema,
  type PublishGeneratedTestRequest,
  type PublishGeneratedTestResponse,
} from "@/features/tests/schemas/publish-generated-test-schema"

export const PUBLISH_GENERATED_TEST_ERROR_MESSAGE =
  "Could not save the generated test. Please review the questions and try again."

export async function publishGeneratedTest(
  input: PublishGeneratedTestRequest
): Promise<PublishGeneratedTestResponse> {
  const validatedInput = PublishGeneratedTestRequestSchema.safeParse(input)

  if (!validatedInput.success) {
    throw new Error(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
  }

  const response = await fetch("/api/admin/tests/publish-generated", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedInput.data),
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
  }

  const parsed = PublishGeneratedTestResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
  }

  return parsed.data
}
