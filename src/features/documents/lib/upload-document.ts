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
import { serializePgvectorEmbedding } from "@/shared/ai/chunk-embeddings"

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

type StoredDocumentForIngestion = {
  id: string
  organization_id: string
  title: string
  file_name: string | null
  file_type: string | null
  storage_path: string | null
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
      message.includes("download") ||
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
    .eq("status", "processing")
}

async function isDocumentStillProcessing(input: {
  documentId: string
  organizationId: string
}): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("documents")
    .select("status")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error("Could not verify document processing status")
  }

  return data?.status === "processing"
}

async function removeStorageObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath])
}

async function storeDocumentFileForDocument(input: {
  documentId: string
  organizationId: string
  preparedFile: PreparedDocumentUploadFile
}): Promise<string> {
  const { documentId, organizationId, preparedFile } = input
  const supabase = createAdminClient()
  const storagePath = `${organizationId}/${documentId}/${preparedFile.safeFileName}`

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
    .eq("organization_id", organizationId)

  if (storagePathError) {
    await removeStorageObject(storagePath)
    throw new Error("Could not save storage path for uploaded document")
  }

  return storagePath
}

async function clearDocumentIngestionArtifacts(input: {
  documentId: string
  organizationId: string
}): Promise<void> {
  const supabase = createAdminClient()

  const { error: chunksError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (chunksError) {
    throw new Error("Could not reset document chunks before ingestion")
  }

  const { error: topicsError } = await supabase
    .from("document_topics")
    .delete()
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (topicsError) {
    const message = topicsError.message ?? ""

    if (
      topicsError.code !== "PGRST205" &&
      !(message.includes("document_topics") && message.includes("schema cache"))
    ) {
      throw new Error("Could not reset document topics before ingestion")
    }
  }
}

function resolveStoredFileExtension(
  document: StoredDocumentForIngestion
): SupportedUploadExtension {
  const extension = isSupportedUploadExtension(document.file_type)
    ? document.file_type
    : getExtensionFromFileName(document.file_name ?? "")

  if (!isSupportedUploadExtension(extension)) {
    throw new Error("Unsupported file type. Allowed: .pdf, .docx, .pptx, .txt, .md")
  }

  return extension
}

async function downloadStoredDocumentBuffer(storagePath: string): Promise<Buffer> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_STORAGE_BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw new Error("Could not download stored document for ingestion")
  }

  return Buffer.from(await data.arrayBuffer())
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

async function runDocumentIngestion(input: {
  documentId: string
  organizationId: string
  title: string
  safeFileName: string
  extension: SupportedUploadExtension
  buffer: Buffer
}): Promise<ProcessDocumentUploadResult> {
  const { documentId, organizationId, title, safeFileName, extension, buffer } = input
  const supabase = createAdminClient()

  try {
    await clearDocumentIngestionArtifacts({ documentId, organizationId })

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

    if (!(await isDocumentStillProcessing({ documentId, organizationId }))) {
      return {
        status: "failed",
        processingError: "Document processing was cancelled.",
      }
    }

    const { error: chunksError } = await supabase.from("document_chunks").insert(
      embeddedChunks.map((chunk) => ({
        organization_id: organizationId,
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        title: chunk.title,
        topic: chunk.topic,
        content: chunk.content,
        embedding: serializePgvectorEmbedding(chunk.embedding),
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

    const { data: finalizedDocument, error: readyError } = await supabase
      .from("documents")
      .update({
        extracted_text: extractedText,
        status: "ready",
        processing_error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("organization_id", organizationId)
      .eq("status", "processing")
      .select("id")
      .maybeSingle()

    if (readyError) {
      throw new Error("Could not finalize document processing")
    }

    if (!finalizedDocument) {
      await clearDocumentIngestionArtifacts({ documentId, organizationId })

      return {
        status: "failed",
        processingError: "Document processing was cancelled.",
      }
    }

    return {
      status: "ready",
      extractedText,
    }
  } catch (error) {
    const processingError = toSafeProcessingError(error)

    await markDocumentFailed(documentId, processingError)

    return {
      status: "failed",
      processingError,
    }
  }
}

export async function processDocumentUploadForDocument(input: {
  documentId: string
  organizationId: string
  preparedFile: PreparedDocumentUploadFile
}): Promise<ProcessDocumentUploadResult> {
  const { documentId, organizationId, preparedFile } = input

  try {
    await storeDocumentFileForDocument({
      documentId,
      organizationId,
      preparedFile,
    })

    return runDocumentIngestion({
      documentId,
      organizationId,
      title: preparedFile.title,
      safeFileName: preparedFile.safeFileName,
      extension: preparedFile.extension,
      buffer: preparedFile.buffer,
    })
  } catch (error) {
    const processingError = toSafeProcessingError(error)

    await markDocumentFailed(documentId, processingError)

    return {
      status: "failed",
      processingError,
    }
  }
}

export async function ingestDocument(input: {
  documentId: string
  organizationId: string
}): Promise<ProcessDocumentUploadResult> {
  const supabase = createAdminClient()

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, organization_id, title, file_name, file_type, storage_path")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not load document for ingestion: ${error.message}`)
  }

  if (!document) {
    throw new Error("Document not found")
  }

  const storedDocument = document as StoredDocumentForIngestion
  const storagePath = storedDocument.storage_path

  if (!storagePath) {
    const processingError = "Stored document file is missing. Please upload the document again."
    await markDocumentFailed(input.documentId, processingError)

    return {
      status: "failed",
      processingError,
    }
  }

  const extension = resolveStoredFileExtension(storedDocument)
  const safeFileName = storedDocument.file_name ?? `${storedDocument.id}.${extension}`

  const { error: processingError } = await supabase
    .from("documents")
    .update({
      status: "processing",
      processing_error: null,
      processed_at: null,
    })
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (processingError) {
    throw new Error(`Could not mark document as processing: ${processingError.message}`)
  }

  const buffer = await downloadStoredDocumentBuffer(storagePath)

  return runDocumentIngestion({
    documentId: input.documentId,
    organizationId: input.organizationId,
    title: storedDocument.title,
    safeFileName,
    extension,
    buffer,
  })
}

export async function storeUploadedDocument(input: {
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

  try {
    await storeDocumentFileForDocument({
      documentId,
      organizationId,
      preparedFile,
    })

    await createDocumentVersionEvent({
      organizationId,
      documentId,
      eventType: "initial_upload",
      createdBy: input.admin.userId,
      changeMessage: "Initial upload",
    })
  } catch (error) {
    const processingError = toSafeProcessingError(error)

    await markDocumentFailed(documentId, processingError)
    throw new Error(processingError)
  }

  return {
    documentId,
    status: "processing",
    redirectTo: `/admin/documents/${documentId}`,
  }
}
