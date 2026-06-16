import "server-only"

import type {
  DocumentChunk,
  DocumentFileType,
  DocumentStatus,
  DocumentTopic,
  DocumentDetail,
} from "@/features/documents/types/document"
import { resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { createAdminClient } from "@/lib/supabase/admin"

export type DocumentsListResult = {
  documents: DocumentDetail[]
  source: "supabase" | "fallback"
}

type DocumentRow = {
  id: string
  organization_id: string
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
  parent_document_id: string | null
  version_number: number
  is_latest: boolean
  replaced_by_document_id: string | null
  change_message: string | null
  ai_change_summary: string | null
  archived_at: string | null
  deleted_at: string | null
  deletion_reason: string | null
  supports_archive_delete: boolean
  created_by: string | null
}

type ChunkRow = {
  id: string
  document_id: string
  chunk_index: number
  title: string | null
  topic: string | null
  content: string
  embedding: unknown | null
}

type TopicRow = {
  id: string
  document_id: string
  topic: string
  description: string | null
  confidence: number | null
  source: string
}

type SupabaseQueryError = {
  code?: string
  message?: string
}

const LEGACY_DOCUMENT_SELECT = [
  "id",
  "title",
  "description",
  "source_type",
  "file_name",
  "file_type",
  "file_size_mb",
  "status",
  "extracted_text",
  "extraction_method",
  "processing_error",
  "processed_at",
  "storage_path",
  "created_at",
  "updated_at",
  "parent_document_id",
  "version_number",
  "is_latest",
  "replaced_by_document_id",
  "change_message",
  "ai_change_summary",
  "organization_id",
  "created_by",
].join(", ")

const DOCUMENT_SELECT = [
  LEGACY_DOCUMENT_SELECT,
  "archived_at",
  "deleted_at",
  "deletion_reason",
].join(", ")

function isMissingDocumentTopicsTableError(error: SupabaseQueryError): boolean {
  const message = error.message ?? ""

  return (
    error.code === "PGRST205" ||
    (message.includes("document_topics") && message.includes("schema cache"))
  )
}

function isMissingDocumentArchiveColumnsError(error: SupabaseQueryError): boolean {
  const message = error.message ?? ""

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    ((message.includes("archived_at") ||
      message.includes("deleted_at") ||
      message.includes("deletion_reason")) &&
      (message.includes("does not exist") || message.includes("schema cache")))
  )
}

function normalizeDocumentRows(
  rows: unknown[] | null,
  supportsArchiveDelete: boolean
): DocumentRow[] {
  return (rows ?? []).map((row) => {
    const document = row as Partial<DocumentRow>

    return {
      ...document,
      archived_at: document.archived_at ?? null,
      deleted_at: document.deleted_at ?? null,
      deletion_reason: document.deletion_reason ?? null,
      supports_archive_delete: supportsArchiveDelete,
    } as DocumentRow
  })
}

function warnMissingArchiveColumnsFallback(): void {
  console.warn(
    "Document archive/delete columns are not available yet; falling back to the pre-00006 document select. Apply supabase/migrations/00006_document_archive_delete_and_test_inactivation.sql to enable archive/delete metadata."
  )
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
    status === "uploaded" ||
    status === "archived" ||
    status === "deleted"
  ) {
    return status
  }

  return "uploaded"
}

function deriveTopics(chunks: DocumentChunk[]): string[] {
  return Array.from(new Set(chunks.map((chunk) => chunk.topic).filter((topic) => topic.length > 0)))
}

function hasStoredEmbedding(embedding: unknown | null): boolean {
  if (Array.isArray(embedding)) {
    return embedding.length > 0
  }

  if (typeof embedding === "string") {
    return embedding.trim().length > 0
  }

  return embedding !== null && embedding !== undefined
}

function mapChunkRows(rows: ChunkRow[]): { chunks: DocumentChunk[]; hasEmbeddedChunks: boolean } {
  const chunks = rows.map((row) => ({
    id: row.id,
    content: row.content,
    topic: row.topic ?? "General",
    chunkIndex: row.chunk_index,
  }))

  const hasEmbeddedChunks =
    rows.length > 0 && rows.every((row) => hasStoredEmbedding(row.embedding))

  return { chunks, hasEmbeddedChunks }
}

function mapTopicRows(rows: TopicRow[]): DocumentTopic[] {
  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    description: row.description,
    confidence: row.confidence,
    source: row.source,
  }))
}

function resolveDocumentTopics(
  topicRows: TopicRow[],
  chunks: DocumentChunk[]
): { topics: string[]; documentTopics: DocumentTopic[] } {
  if (topicRows.length > 0) {
    const documentTopics = mapTopicRows(topicRows)
    const topics = documentTopics.map((item) => item.topic)

    return { topics, documentTopics }
  }

  const topics = deriveTopics(chunks)

  return {
    topics,
    documentTopics: topics.map((topic) => ({
      topic,
      description: null,
      confidence: null,
      source: "chunk",
    })),
  }
}

function mapDocumentToDetail(
  document: DocumentRow,
  chunkRows: ChunkRow[],
  topicRows: TopicRow[] = [],
  versionRows: DocumentRow[] = [document]
): DocumentDetail {
  const { chunks, hasEmbeddedChunks } = mapChunkRows(chunkRows)
  const { topics, documentTopics } = resolveDocumentTopics(topicRows, chunks)
  const status = normalizeDocumentStatus(document.status)
  const uploadedAt = document.created_at.slice(0, 10)
  const sortedVersionRows = [...versionRows].sort((a, b) => b.version_number - a.version_number)
  const latestVersion =
    sortedVersionRows.find((version) => version.is_latest) ?? sortedVersionRows[0]
  const newerVersion =
    document.replaced_by_document_id ??
    sortedVersionRows.find((version) => version.version_number > document.version_number)?.id ??
    null
  const fileSizeMb =
    typeof document.file_size_mb === "number" && Number.isFinite(document.file_size_mb)
      ? Number(document.file_size_mb)
      : 1

  return {
    id: document.id,
    title: document.title,
    status,
    sourceType: document.source_type,
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
    canDownloadOriginal: status !== "deleted" && Boolean(document.storage_path),
    supportsArchiveDelete: document.supports_archive_delete,
    archivedAt: document.archived_at,
    deletedAt: document.deleted_at,
    deletionReason: document.deletion_reason,
    versionNumber: document.version_number,
    isLatestVersion: document.is_latest,
    latestDocumentId: latestVersion?.id ?? document.id,
    newerVersionId: newerVersion,
    changeMessage: document.change_message,
    aiChangeSummary: document.ai_change_summary,
    topicsCount: topics.length,
    topics,
    documentTopics,
    chunks,
    linkedTests: [],
    versions: sortedVersionRows.map((version) => ({
      id: version.id,
      version: version.version_number,
      uploadedAt: version.created_at.slice(0, 10),
      status: normalizeDocumentStatus(version.status),
      isLatest: version.is_latest,
      isCurrent: version.id === document.id,
      changeMessage: version.change_message,
      aiChangeSummary: version.ai_change_summary,
      newerVersionId: version.replaced_by_document_id,
    })),
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

async function fetchTopicsByDocumentIds(documentIds: string[]): Promise<Map<string, TopicRow[]>> {
  const topicsByDocumentId = new Map<string, TopicRow[]>()

  if (documentIds.length === 0) {
    return topicsByDocumentId
  }

  const supabase = createAdminClient()

  const { data: topics, error } = await supabase
    .from("document_topics")
    .select("id, document_id, topic, description, confidence, source")
    .in("document_id", documentIds)
    .order("topic", { ascending: true })

  if (error) {
    if (isMissingDocumentTopicsTableError(error)) {
      console.warn(
        "document_topics table is not available yet; falling back to chunk-derived topics."
      )
      return topicsByDocumentId
    }

    throw new Error(`Failed to fetch document topics: ${error.message}`)
  }

  for (const topic of (topics ?? []) as TopicRow[]) {
    const existing = topicsByDocumentId.get(topic.document_id) ?? []
    existing.push(topic)
    topicsByDocumentId.set(topic.document_id, existing)
  }

  return topicsByDocumentId
}

function getDocumentRootId(document: DocumentRow): string {
  return document.parent_document_id ?? document.id
}

async function fetchVersionRowsByRootIds(rootIds: string[]): Promise<Map<string, DocumentRow[]>> {
  const versionsByRootId = new Map<string, DocumentRow[]>()
  const uniqueRootIds = Array.from(new Set(rootIds))

  if (uniqueRootIds.length === 0) {
    return versionsByRootId
  }

  const supabase = createAdminClient()
  const rootList = uniqueRootIds.join(",")

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .or(`id.in.(${rootList}),parent_document_id.in.(${rootList})`)
    .order("version_number", { ascending: false })
    .order("created_at", { ascending: false })

  let rows = normalizeDocumentRows(data as unknown[] | null, true)

  if (error && isMissingDocumentArchiveColumnsError(error)) {
    warnMissingArchiveColumnsFallback()

    const { data: legacyData, error: legacyError } = await supabase
      .from("documents")
      .select(LEGACY_DOCUMENT_SELECT)
      .or(`id.in.(${rootList}),parent_document_id.in.(${rootList})`)
      .order("version_number", { ascending: false })
      .order("created_at", { ascending: false })

    if (legacyError) {
      throw new Error(`Failed to fetch document version history: ${legacyError.message}`)
    }

    rows = normalizeDocumentRows(legacyData as unknown[] | null, false)
  } else if (error) {
    throw new Error(`Failed to fetch document version history: ${error.message}`)
  }

  for (const version of rows) {
    const rootId = getDocumentRootId(version)
    const existing = versionsByRootId.get(rootId) ?? []
    existing.push(version)
    versionsByRootId.set(rootId, existing)
  }

  return versionsByRootId
}

export async function getDocumentsFromSupabase(): Promise<DocumentsListResult> {
  const supabase = createAdminClient()

  const { data: documents, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("is_latest", true)
    .order("updated_at", { ascending: false })

  let documentRows = normalizeDocumentRows(documents as unknown[] | null, true)

  if (error && isMissingDocumentArchiveColumnsError(error)) {
    warnMissingArchiveColumnsFallback()

    const { data: legacyDocuments, error: legacyError } = await supabase
      .from("documents")
      .select(LEGACY_DOCUMENT_SELECT)
      .eq("is_latest", true)
      .order("updated_at", { ascending: false })

    if (legacyError) {
      throw new Error(`Failed to fetch documents: ${legacyError.message}`)
    }

    documentRows = normalizeDocumentRows(legacyDocuments as unknown[] | null, false)
  } else if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  if (documentRows.length === 0) {
    return { documents: [], source: "supabase" }
  }

  const documentIds = documentRows.map((doc) => doc.id)
  const rootIds = documentRows.map(getDocumentRootId)
  const [chunksByDocumentId, topicsByDocumentId] = await Promise.all([
    fetchChunksByDocumentIds(documentIds),
    fetchTopicsByDocumentIds(documentIds),
  ])
  const versionsByRootId = await fetchVersionRowsByRootIds(rootIds)

  return {
    documents: documentRows.map((document) =>
      mapDocumentToDetail(
        document,
        chunksByDocumentId.get(document.id) ?? [],
        topicsByDocumentId.get(document.id) ?? [],
        versionsByRootId.get(getDocumentRootId(document)) ?? [document]
      )
    ),
    source: "supabase",
  }
}

export async function getDocumentDetailById(
  routeOrDocumentId: string
): Promise<DocumentDetail | null> {
  const apiDocumentId = resolveApiDocumentId(routeOrDocumentId)

  if (!apiDocumentId) {
    return null
  }

  const supabase = createAdminClient()

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", apiDocumentId)
    .maybeSingle()

  let documentRow = normalizeDocumentRows(document ? [document] : [], true)[0] ?? null

  if (documentError && isMissingDocumentArchiveColumnsError(documentError)) {
    warnMissingArchiveColumnsFallback()

    const { data: legacyDocument, error: legacyError } = await supabase
      .from("documents")
      .select(LEGACY_DOCUMENT_SELECT)
      .eq("id", apiDocumentId)
      .maybeSingle()

    if (legacyError) {
      throw new Error(`Failed to fetch document detail: ${legacyError.message}`)
    }

    documentRow = normalizeDocumentRows(legacyDocument ? [legacyDocument] : [], false)[0] ?? null
  } else if (documentError) {
    throw new Error(`Failed to fetch document detail: ${documentError.message}`)
  }

  if (!documentRow) {
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

  const [topicsByDocumentId, versionsByRootId] = await Promise.all([
    fetchTopicsByDocumentIds([apiDocumentId]),
    fetchVersionRowsByRootIds([getDocumentRootId(documentRow)]),
  ])

  return mapDocumentToDetail(
    documentRow,
    (chunks ?? []) as ChunkRow[],
    topicsByDocumentId.get(apiDocumentId) ?? [],
    versionsByRootId.get(getDocumentRootId(documentRow)) ?? [documentRow]
  )
}
