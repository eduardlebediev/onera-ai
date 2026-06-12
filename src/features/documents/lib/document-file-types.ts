export const DOCUMENTS_STORAGE_BUCKET = "documents"

export const SUPPORTED_UPLOAD_EXTENSIONS = ["pdf", "docx", "pptx", "txt", "md"] as const

export type SupportedUploadExtension = (typeof SUPPORTED_UPLOAD_EXTENSIONS)[number]

export const EXTENSION_MIME_TYPES: Record<SupportedUploadExtension, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain", "text/x-markdown"],
}

export const NATIVE_TEXT_EXTENSIONS = new Set<SupportedUploadExtension>(["txt", "md"])

export const AI_EXTRACTION_EXTENSIONS = new Set<SupportedUploadExtension>(["pdf", "docx", "pptx"])

export function getExtensionFromFileName(fileName: string): string | null {
  const parts = fileName.split(".")
  if (parts.length < 2) {
    return null
  }

  return parts.pop()?.toLowerCase() ?? null
}

export function isSupportedUploadExtension(
  extension: string | null
): extension is SupportedUploadExtension {
  return (
    extension !== null &&
    SUPPORTED_UPLOAD_EXTENSIONS.includes(extension as SupportedUploadExtension)
  )
}

export function getExtractionMethod(
  extension: SupportedUploadExtension
): "native-text" | "ai-file-extraction" {
  return NATIVE_TEXT_EXTENSIONS.has(extension) ? "native-text" : "ai-file-extraction"
}

export function getMimeTypeForExtension(extension: SupportedUploadExtension): string {
  return EXTENSION_MIME_TYPES[extension][0]
}

export function isAllowedMimeType(extension: SupportedUploadExtension, mimeType: string): boolean {
  const normalized = mimeType.toLowerCase().split(";")[0]?.trim() ?? ""
  return EXTENSION_MIME_TYPES[extension].includes(normalized)
}

export function sanitizeStorageFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? "document"
  const sanitized = baseName.replace(/[^\w.\-() ]+/g, "_").trim()

  return sanitized.length > 0 ? sanitized : "document"
}

export function getMaxUploadBytes(): number {
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? "10")

  if (!Number.isFinite(maxMb) || maxMb <= 0) {
    return 10 * 1024 * 1024
  }

  return maxMb * 1024 * 1024
}
