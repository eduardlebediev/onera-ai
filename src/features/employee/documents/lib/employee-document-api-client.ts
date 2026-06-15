import { DocumentDownloadUrlResponseSchema } from "@/features/documents/schemas/document-upload-schema"

export async function requestEmployeeDocumentDownloadUrl(
  documentId: string,
  testId?: string
): Promise<string> {
  const params = testId ? `?testId=${encodeURIComponent(testId)}` : ""
  const response = await fetch(`/api/employee/documents/${documentId}/download-url${params}`, {
    method: "POST",
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

    throw new Error(serverMessage?.trim() || "Could not download the original file.")
  }

  const parsed = DocumentDownloadUrlResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Could not download the original file.")
  }

  return parsed.data.signedUrl
}
