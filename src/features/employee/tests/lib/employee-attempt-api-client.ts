import {
  StartAttemptResponseSchema,
  SubmitAttemptResponseSchema,
} from "@/features/employee/tests/schemas/submit-attempt-schema"
import type { SubmitAttemptRequest } from "@/features/employee/tests/schemas/submit-attempt-schema"

export const EMPLOYEE_ATTEMPT_ERROR_MESSAGE = "Could not save your test answers. Please try again."

export async function startEmployeeTestAttempt(testId: string): Promise<{ attemptId: string }> {
  const response = await fetch(`/api/employee/tests/${testId}/start`, {
    method: "POST",
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: string } | null
    throw new Error(errorPayload?.error ?? EMPLOYEE_ATTEMPT_ERROR_MESSAGE)
  }

  const parsed = StartAttemptResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(EMPLOYEE_ATTEMPT_ERROR_MESSAGE)
  }

  return { attemptId: parsed.data.attemptId }
}

export async function submitEmployeeTestAttempt(
  testId: string,
  input: SubmitAttemptRequest
): Promise<{ redirectTo: string }> {
  const response = await fetch(`/api/employee/tests/${testId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: string } | null
    throw new Error(errorPayload?.error ?? EMPLOYEE_ATTEMPT_ERROR_MESSAGE)
  }

  const parsed = SubmitAttemptResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(EMPLOYEE_ATTEMPT_ERROR_MESSAGE)
  }

  return { redirectTo: parsed.data.redirectTo }
}
