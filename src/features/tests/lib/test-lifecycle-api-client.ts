import type { TestMetadataUpdateRequest } from "@/features/tests/schemas/test-lifecycle-schema"

export type TestLifecycleImpact = {
  assignmentCount: number
  activeAssignmentCount: number
  attemptCount: number
  completedAttemptCount: number
}

export type TestLifecycleResponse = {
  testId: string
  status: string
  isActive: boolean
  impact: TestLifecycleImpact
}

export type DeleteTestResponse = TestLifecycleResponse & {
  deleteMode: "hard_deleted" | "tombstoned"
}

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

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function requestLifecycleAction<T>(response: Response, fallback: string): Promise<T> {
  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallback))
  }

  return payload as T
}

export async function updateTestMetadata(
  testId: string,
  metadata: TestMetadataUpdateRequest
): Promise<TestLifecycleResponse> {
  const response = await fetch(`/api/admin/tests/${testId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  })

  return requestLifecycleAction<TestLifecycleResponse>(response, "Failed to update test metadata")
}

export async function archiveTest(testId: string): Promise<TestLifecycleResponse> {
  const response = await fetch(`/api/admin/tests/${testId}/archive`, {
    method: "POST",
  })

  return requestLifecycleAction<TestLifecycleResponse>(response, "Failed to archive test")
}

export async function restoreTest(testId: string): Promise<TestLifecycleResponse> {
  const response = await fetch(`/api/admin/tests/${testId}/restore`, {
    method: "POST",
  })

  return requestLifecycleAction<TestLifecycleResponse>(response, "Failed to restore test")
}

export async function deleteTest(input: {
  testId: string
  deletionReason?: string
}): Promise<DeleteTestResponse> {
  const response = await fetch(`/api/admin/tests/${input.testId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deletionReason: input.deletionReason }),
  })

  return requestLifecycleAction<DeleteTestResponse>(response, "Failed to delete test")
}
