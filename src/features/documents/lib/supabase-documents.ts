import "server-only"

import type {
  DocumentChunk,
  DocumentFileType,
  DocumentStatus,
  MockDocumentDetail,
} from "@/data/mock/documents"
import { resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { createAdminClient } from "@/lib/supabase/admin"

export type DocumentsListResult = {
  documents: MockDocumentDetail[]
  source: "supabase" | "fallback"
}

type DocumentRow = {
  id: string
  title: string
  description: string | null
  source_type: string
  file_name: string | null
  file_type: string | null
  file_size_mb: number | null
  status: string
  extracted_text: string | null
  extraction_method: string | null
  processing_error: string | null
  processed_at: string | null
  storage_path: string | null
  created_at: string
  updated_at: string
}

type ChunkRow = {
  id: string
  document_id: string
  chunk_index: number
  title: string | null
  topic: string | null
  content: string
  embedding: number[] | null
}

function inferFileType(fileName: string | null, fileType: string | null): DocumentFileType {
  if (
    fileType === "pdf" ||
    fileType === "docx" ||
    fileType === "pptx" ||
    fileType === "txt" ||
    fileType === "md"
  ) {
    return fileType
  }

  if (!fileName) {
    return "txt"
  }

  const extension = fileName.split(".").pop()?.toLowerCase()

  if (extension === "pdf") return "pdf"
  if (extension === "docx") return "docx"
  if (extension === "pptx") return "pptx"
  if (extension === "md") return "md"

  return "txt"
}

function normalizeDocumentStatus(status: string): DocumentStatus {
  if (
    status === "ready" ||
    status === "processing" ||
    status === "failed" ||
    status === "uploaded"
  ) {
    return status
  }

  return "uploaded"
}

function deriveTopics(chunks: DocumentChunk[]): string[] {
  return Array.from(new Set(chunks.map((chunk) => chunk.topic).filter((topic) => topic.length > 0)))
}

function mapChunkRows(rows: ChunkRow[]): { chunks: DocumentChunk[]; hasEmbeddedChunks: boolean } {
  const chunks = rows.map((row) => ({
    id: row.id,
    content: row.content,
    topic: row.topic ?? "General",
    chunkIndex: row.chunk_index,
  }))

  const hasEmbeddedChunks =
    rows.length > 0 && rows.every((row) => Array.isArray(row.embedding) && row.embedding.length > 0)

  return { chunks, hasEmbeddedChunks }
}

function mapDocumentToDetail(document: DocumentRow, chunkRows: ChunkRow[]): MockDocumentDetail {
  const { chunks, hasEmbeddedChunks } = mapChunkRows(chunkRows)
  const topics = deriveTopics(chunks)
  const status = normalizeDocumentStatus(document.status)
  const uploadedAt = document.created_at.slice(0, 10)
  const fileSizeMb =
    typeof document.file_size_mb === "number" && Number.isFinite(document.file_size_mb)
      ? Number(document.file_size_mb)
      : 1

  return {
    id: document.id,
    title: document.title,
    status,
    fileType: inferFileType(document.file_name, document.file_type),
    fileSizeMb,
    fileName: document.file_name ?? undefined,
    description: document.description ?? "",
    uploadedAt,
    extractedText: document.extracted_text?.trim() ? document.extracted_text : undefined,
    extractionMethod: document.extraction_method,
    processingError: document.processing_error,
    processedAt: document.processed_at ?? undefined,
    hasEmbeddedChunks,
    canDownloadOriginal: Boolean(document.storage_path),
    topicsCount: topics.length,
    topics,
    chunks,
    linkedTests: [],
    versions: [
      {
        id: `${document.id}-v1`,
        version: 1,
        uploadedAt,
        status,
      },
    ],
  }
}

async function fetchChunksByDocumentIds(documentIds: string[]): Promise<Map<string, ChunkRow[]>> {
  const chunksByDocumentId = new Map<string, ChunkRow[]>()

  if (documentIds.length === 0) {
    return chunksByDocumentId
  }

  const supabase = createAdminClient()

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, title, topic, content, embedding")
    .in("document_id", documentIds)
    .order("chunk_index", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch document chunks: ${error.message}`)
  }

  for (const chunk of (chunks ?? []) as ChunkRow[]) {
    const existing = chunksByDocumentId.get(chunk.document_id) ?? []
    existing.push(chunk)
    chunksByDocumentId.set(chunk.document_id, existing)
  }

  return chunksByDocumentId
}

export async function getDocumentsFromSupabase(): Promise<DocumentsListResult> {
  const supabase = createAdminClient()

  const { data: documents, error } = await supabase
    .from("documents")
    .select(
      "id, title, description, source_type, file_name, file_type, file_size_mb, status, extracted_text, extraction_method, processing_error, processed_at, storage_path, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  const documentRows = (documents ?? []) as DocumentRow[]

  if (documentRows.length === 0) {
    return { documents: [], source: "supabase" }
  }

  const chunksByDocumentId = await fetchChunksByDocumentIds(documentRows.map((doc) => doc.id))

  return {
    documents: documentRows.map((document) =>
      mapDocumentToDetail(document, chunksByDocumentId.get(document.id) ?? [])
    ),
    source: "supabase",
  }
}

export async function getDocumentDetailById(
  routeOrDocumentId: string
): Promise<MockDocumentDetail | null> {
  const apiDocumentId = resolveApiDocumentId(routeOrDocumentId)

  if (!apiDocumentId) {
    return null
  }

  const supabase = createAdminClient()

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(
      "id, title, description, source_type, file_name, file_type, file_size_mb, status, extracted_text, extraction_method, processing_error, processed_at, storage_path, created_at, updated_at"
    )
    .eq("id", apiDocumentId)
    .maybeSingle()

  if (documentError) {
    throw new Error(`Failed to fetch document detail: ${documentError.message}`)
  }

  if (!document) {
    return null
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("id, document_id, chunk_index, title, topic, content, embedding")
    .eq("document_id", apiDocumentId)
    .order("chunk_index", { ascending: true })

  if (chunksError) {
    throw new Error(`Failed to fetch document chunks: ${chunksError.message}`)
  }

  return mapDocumentToDetail(document as DocumentRow, (chunks ?? []) as ChunkRow[])
}
