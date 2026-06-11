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
  status: string
  extracted_text: string | null
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
}

function inferFileType(fileName: string | null): DocumentFileType {
  if (!fileName) {
    return "txt"
  }

  const extension = fileName.split(".").pop()?.toLowerCase()

  if (extension === "pdf") return "pdf"
  if (extension === "docx") return "docx"
  if (extension === "pptx") return "pptx"

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

function mapChunkRows(rows: ChunkRow[]): DocumentChunk[] {
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    topic: row.topic ?? "General",
    chunkIndex: row.chunk_index,
  }))
}

function mapDocumentToDetail(document: DocumentRow, chunks: DocumentChunk[]): MockDocumentDetail {
  const topics = deriveTopics(chunks)
  const status = normalizeDocumentStatus(document.status)
  const uploadedAt = document.created_at.slice(0, 10)

  return {
    id: document.id,
    title: document.title,
    status,
    fileType: inferFileType(document.file_name),
    fileSizeMb: 1,
    description: document.description ?? "",
    uploadedAt,
    extractedText: document.extracted_text?.trim() ? document.extracted_text : undefined,
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
    .select("id, document_id, chunk_index, title, topic, content")
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
      "id, title, description, source_type, file_name, status, extracted_text, created_at, updated_at"
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
      mapDocumentToDetail(document, mapChunkRows(chunksByDocumentId.get(document.id) ?? []))
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
      "id, title, description, source_type, file_name, status, extracted_text, created_at, updated_at"
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
    .select("id, document_id, chunk_index, title, topic, content")
    .eq("document_id", apiDocumentId)
    .order("chunk_index", { ascending: true })

  if (chunksError) {
    throw new Error(`Failed to fetch document chunks: ${chunksError.message}`)
  }

  return mapDocumentToDetail(document as DocumentRow, mapChunkRows((chunks ?? []) as ChunkRow[]))
}
