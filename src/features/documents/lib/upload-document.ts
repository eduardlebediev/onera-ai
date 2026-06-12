import "server-only"

import OpenAI from "openai"

import type { CurrentUser } from "@/features/auth/lib/current-user"
import { chunkExtractedText } from "@/features/documents/lib/chunk-extracted-text"
import { chunkExtractedTextAi } from "@/features/documents/lib/chunk-extracted-text-ai"
import {
  DOCUMENTS_STORAGE_BUCKET,
  getExtractionMethod,
  getExtensionFromFileName,
  getMaxUploadBytes,
  getMimeTypeForExtension,
  isAllowedMimeType,
  isSupportedUploadExtension,
  sanitizeStorageFileName,
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

export async function uploadAndIngestDocument(input: {
  admin: CurrentUser
  file: File
}): Promise<UploadDocumentResult> {
  const extension = getExtensionFromFileName(input.file.name)

  if (!isSupportedUploadExtension(extension)) {
    throw new Error("Unsupported file type. Allowed: .pdf, .docx, .pptx, .txt, .md")
  }

  const maxBytes = getMaxUploadBytes()

  if (input.file.size > maxBytes) {
    throw new Error(`File is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB`)
  }

  if (input.file.size === 0) {
    throw new Error("Uploaded file is empty")
  }

  const mimeType = input.file.type || getMimeTypeForExtension(extension)

  if (!isAllowedMimeType(extension, mimeType)) {
    throw new Error("File MIME type does not match the selected file extension")
  }

  const buffer = Buffer.from(await input.file.arrayBuffer())
  const safeFileName = sanitizeStorageFileName(input.file.name)
  const title = deriveTitleFromFileName(safeFileName)
  const fileSizeMb = Number((input.file.size / (1024 * 1024)).toFixed(3))
  const extractionMethod = getExtractionMethod(extension)
  const organizationId = input.admin.membership.organizationId

  const supabase = createAdminClient()

  const { data: document, error: createError } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      title,
      description: `Uploaded document: ${safeFileName}`,
      source_type: "upload",
      file_name: safeFileName,
      file_type: extension,
      file_size_mb: fileSizeMb,
      status: "processing",
      extraction_method: extractionMethod,
      created_by: input.admin.userId,
    })
    .select("id")
    .single()

  if (createError || !document) {
    throw new Error("Could not create document record")
  }

  const documentId = document.id
  const storagePath = `${organizationId}/${documentId}/${safeFileName}`

  try {
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
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
      buffer,
      fileName: safeFileName,
      extension,
    })

    const aiChunks = await chunkExtractedTextAi(extractedText, title)
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
      fileType: extension,
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
      title,
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
      documentId,
      status: "ready",
      redirectTo: `/admin/documents/${documentId}`,
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
      documentId,
      status: "failed",
      redirectTo: `/admin/documents/${documentId}`,
    }
  }
}
