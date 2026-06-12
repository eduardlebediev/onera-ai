import {
  DocumentDownloadUrlResponseSchema,
  UploadDocumentResponseSchema,
} from "@/features/documents/schemas/document-upload-schema"

const DEFAULT_UPLOAD_ERROR = "Could not upload this document. Please try again."

function getUploadErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage?.trim()) {
    return serverMessage.trim()
  }

  if (status === 401 || status === 403) {
    return "You do not have permission to upload documents."
  }

  return DEFAULT_UPLOAD_ERROR
}

export async function uploadDocument(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/admin/documents/upload", {
    method: "POST",
    body: formData,
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

    throw new Error(getUploadErrorMessage(response.status, serverMessage))
  }

  const parsed = UploadDocumentResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(DEFAULT_UPLOAD_ERROR)
  }

  return parsed.data
}

export async function requestDocumentDownloadUrl(documentId: string): Promise<string> {
  const response = await fetch(`/api/admin/documents/${documentId}/download-url`, {
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
