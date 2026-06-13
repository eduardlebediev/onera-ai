import {
  ArchiveDocumentResponseSchema,
  DeleteDocumentResponseSchema,
  DocumentDownloadUrlResponseSchema,
  UploadDocumentResponseSchema,
  UploadDocumentVersionResponseSchema,
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

export async function uploadDocumentVersion(input: {
  documentId: string
  file: File
  changeMessage?: string
}) {
  const formData = new FormData()
  formData.append("file", input.file)

  if (input.changeMessage?.trim()) {
    formData.append("changeMessage", input.changeMessage.trim())
  }

  const response = await fetch(`/api/admin/documents/${input.documentId}/versions`, {
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

  const parsed = UploadDocumentVersionResponseSchema.safeParse(payload)

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

function getDocumentActionErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage?.trim()) {
    return serverMessage.trim()
  }

  if (status === 401 || status === 403) {
    return "You do not have permission to manage this document."
  }

  return "Could not complete this document action."
}

export async function archiveDocument(documentId: string) {
  const response = await fetch(`/api/admin/documents/${documentId}/archive`, {
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

    throw new Error(getDocumentActionErrorMessage(response.status, serverMessage))
  }

  const parsed = ArchiveDocumentResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(getDocumentActionErrorMessage(response.status))
  }

  return parsed.data
}

export async function permanentlyDeleteDocument(input: {
  documentId: string
  deletionReason?: string
}) {
  const response = await fetch(`/api/admin/documents/${input.documentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deletionReason: input.deletionReason,
    }),
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

    throw new Error(getDocumentActionErrorMessage(response.status, serverMessage))
  }

  const parsed = DeleteDocumentResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(getDocumentActionErrorMessage(response.status))
  }

  return parsed.data
}
