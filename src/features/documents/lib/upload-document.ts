import "server-only"

import OpenAI from "openai"

import type { CurrentUser } from "@/features/auth/lib/current-user"
import { chunkExtractedText } from "@/features/documents/lib/chunk-extracted-text"
import { chunkExtractedTextAi } from "@/features/documents/lib/chunk-extracted-text-ai"
import { createDocumentVersionEvent } from "@/features/documents/lib/document-version-events"
import {
  DOCUMENTS_STORAGE_BUCKET,
  getExtractionMethod,
  getExtensionFromFileName,
  getMaxUploadBytes,
  getMimeTypeForExtension,
  isAllowedMimeType,
  isSupportedUploadExtension,
  sanitizeStorageFileName,
  type SupportedUploadExtension,
} from "@/features/documents/lib/document-file-types"
import { embedDocumentChunks } from "@/features/documents/lib/embed-document-chunks"
import { extractDocumentText } from "@/features/documents/lib/extract-document-text"
import { persistDocumentTopicsBestEffort } from "@/features/documents/lib/persist-document-topics"
import { createAdminClient } from "@/lib/supabase/admin"

export type UploadDocumentResult = {
  documentId: string
  status: "ready" | "failed" | "processing"
  redirectTo: string
}

export type PreparedDocumentUploadFile = {
  extension: SupportedUploadExtension
  mimeType: string
  buffer: Buffer
  safeFileName: string
  title: string
  fileSizeMb: number
  extractionMethod: string
}

export type ProcessDocumentUploadResult =
  | {
      status: "ready"
      extractedText: string
    }
  | {
      status: "failed"
      processingError: string
    }

function deriveTitleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "")
  const normalized = withoutExtension.replace(/[_-]+/g, " ").trim()

  return normalized.length > 0 ? normalized : fileName
}

function toSafeProcessingError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim()

    if (
      message.includes("unsupported") ||
      message.includes("too large") ||
      message.includes("No readable text") ||
      message.includes("AI extraction") ||
      message.includes("embedding") ||
      message.includes("storage") ||
      message.includes("chunk")
    ) {
      return message
    }
  }

  return "Document processing failed. Please try again with a different file."
}

async function markDocumentFailed(documentId: string, processingError: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from("documents")
    .update({
      status: "failed",
      processing_error: processingError,
      processed_at: new Date().toISOString(),
    })
    .eq("id", documentId)
}

async function removeStorageObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath])
}

export async function prepareDocumentUploadFile(file: File): Promise<PreparedDocumentUploadFile> {
  const extension = getExtensionFromFileName(file.name)

  if (!isSupportedUploadExtension(extension)) {
    throw new Error("Unsupported file type. Allowed: .pdf, .docx, .pptx, .txt, .md")
  }

  const maxBytes = getMaxUploadBytes()

  if (file.size > maxBytes) {
    throw new Error(`File is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB`)
  }

  if (file.size === 0) {
    throw new Error("Uploaded file is empty")
  }

  const mimeType = file.type || getMimeTypeForExtension(extension)

  if (!isAllowedMimeType(extension, mimeType)) {
    throw new Error("File MIME type does not match the selected file extension")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeFileName = sanitizeStorageFileName(file.name)
  const title = deriveTitleFromFileName(safeFileName)
  const fileSizeMb = Number((file.size / (1024 * 1024)).toFixed(3))
  const extractionMethod = getExtractionMethod(extension)

  return {
    extension,
    mimeType,
    buffer,
    safeFileName,
    title,
    fileSizeMb,
    extractionMethod,
  }
}

export async function processDocumentUploadForDocument(input: {
  documentId: string
  organizationId: string
  preparedFile: PreparedDocumentUploadFile
}): Promise<ProcessDocumentUploadResult> {
  const { documentId, organizationId, preparedFile } = input

  const supabase = createAdminClient()
  const storagePath = `${organizationId}/${documentId}/${preparedFile.safeFileName}`

  try {
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_STORAGE_BUCKET)
      .upload(storagePath, preparedFile.buffer, {
        contentType: preparedFile.mimeType,
        upsert: false,
      })

    if (storageError) {
      throw new Error("Storage upload failed")
    }

    const { error: storagePathError } = await supabase
      .from("documents")
      .update({ storage_path: storagePath })
      .eq("id", documentId)

    if (storagePathError) {
      throw new Error("Could not save storage path for uploaded document")
    }

    const extractedText = await extractDocumentText({
      buffer: preparedFile.buffer,
      fileName: preparedFile.safeFileName,
      extension: preparedFile.extension,
    })

    const aiChunks = await chunkExtractedTextAi(extractedText, preparedFile.title)
    const chunks = aiChunks ?? chunkExtractedText(extractedText)

    if (chunks.length === 0) {
      throw new Error("Chunking produced no usable document sections")
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured")
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const embeddedChunks = await embedDocumentChunks({
      chunks,
      fileType: preparedFile.extension,
      openai,
    })

    const { error: chunksError } = await supabase.from("document_chunks").insert(
      embeddedChunks.map((chunk) => ({
        organization_id: organizationId,
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        title: chunk.title,
        topic: chunk.topic,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      }))
    )

    if (chunksError) {
      throw new Error("Could not save document chunks")
    }

    await persistDocumentTopicsBestEffort({
      organizationId,
      documentId,
      title: preparedFile.title,
      extractedText,
      chunkTopics: embeddedChunks
        .map((chunk) => chunk.topic)
        .filter((topic): topic is string => Boolean(topic?.trim())),
    })

    const { error: readyError } = await supabase
      .from("documents")
      .update({
        extracted_text: extractedText,
        status: "ready",
        processing_error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    if (readyError) {
      throw new Error("Could not finalize document processing")
    }

    return {
      status: "ready",
      extractedText,
    }
  } catch (error) {
    const processingError = toSafeProcessingError(error)

    await markDocumentFailed(documentId, processingError)

    try {
      await removeStorageObject(storagePath)
    } catch {
      // Best-effort cleanup only.
    }

    return {
      status: "failed",
      processingError,
    }
  }
}

export async function uploadAndIngestDocument(input: {
  admin: CurrentUser
  file: File
}): Promise<UploadDocumentResult> {
  const preparedFile = await prepareDocumentUploadFile(input.file)
  const organizationId = input.admin.membership.organizationId

  const supabase = createAdminClient()

  const { data: document, error: createError } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      title: preparedFile.title,
      description: `Uploaded document: ${preparedFile.safeFileName}`,
      source_type: "upload",
      file_name: preparedFile.safeFileName,
      file_type: preparedFile.extension,
      file_size_mb: preparedFile.fileSizeMb,
      status: "processing",
      extraction_method: preparedFile.extractionMethod,
      created_by: input.admin.userId,
    })
    .select("id")
    .single()

  if (createError || !document) {
    throw new Error("Could not create document record")
  }

  const documentId = document.id
  const result = await processDocumentUploadForDocument({
    documentId,
    organizationId,
    preparedFile,
  })

  if (result.status === "ready") {
    await createDocumentVersionEvent({
      organizationId,
      documentId,
      eventType: "initial_upload",
      createdBy: input.admin.userId,
      changeMessage: "Initial upload",
    })
  }

  return {
    documentId,
    status: result.status,
    redirectTo: `/admin/documents/${documentId}`,
  }
}
