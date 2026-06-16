import "server-only"

import type { MultiDocumentSummary } from "@/features/tests/lib/multi-document-generation"
import type { TestDifficulty, TestLanguage } from "@/features/tests/schemas/generated-test-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import { EMBEDDING_MODEL } from "@/shared/ai/chunk-embeddings"

export { EMBEDDING_MODEL }

export type RetrievedChunk = {
  id: string
  documentId: string
  title: string | null
  topic: string | null
  content: string
  similarity: number
}

export type RetrievedDocumentContext = {
  documents: MultiDocumentSummary[]
  chunks: RetrievedChunk[]
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super("Document not found")
    this.name = "DocumentNotFoundError"
  }
}

export type DocumentSummary = {
  id: string
  title: string
  organizationId: string
  status: string
}

export async function fetchDocumentById(documentId: string): Promise<DocumentSummary | null> {
  const supabase = createAdminClient()

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, organization_id, status")
    .eq("id", documentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch document: ${error.message}`)
  }

  if (!document) {
    return null
  }

  return {
    id: document.id,
    title: document.title,
    organizationId: document.organization_id,
    status: document.status,
  }
}

export class InsufficientContextError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InsufficientContextError"
  }
}

type EmbeddedChunkRow = {
  id: string
  organization_id: string
  document_id: string
  title: string | null
  topic: string | null
  content: string
  chunk_index: number
}

function mapEmbeddedRowsToRetrievedChunks(chunks: EmbeddedChunkRow[]): RetrievedChunk[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    documentId: chunk.document_id,
    title: chunk.title,
    topic: chunk.topic,
    content: chunk.content,
    similarity: 0,
  }))
}

async function fetchEmbeddedChunksForDocuments(input: {
  documentIds: string[]
  organizationId: string
}): Promise<EmbeddedChunkRow[]> {
  const supabase = createAdminClient()

  const { data: embeddedChunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("id, organization_id, document_id, title, topic, content, chunk_index")
    .eq("organization_id", input.organizationId)
    .in("document_id", input.documentIds)
    .not("embedding", "is", null)
    .order("chunk_index", { ascending: true })

  if (chunksError) {
    throw new Error(`Failed to fetch embedded chunks: ${chunksError.message}`)
  }

  return (embeddedChunks ?? []) as EmbeddedChunkRow[]
}

export async function retrieveDocumentContext(input: {
  document: DocumentSummary
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
}): Promise<RetrievedDocumentContext> {
  return retrieveMultiDocumentContext({
    documents: [
      {
        id: input.document.id,
        title: input.document.title,
        organizationId: input.document.organizationId,
      },
    ],
    questionCount: input.questionCount,
    difficulty: input.difficulty,
    language: input.language,
    targetRole: input.targetRole,
  })
}

export async function retrieveMultiDocumentContext(input: {
  documents: MultiDocumentSummary[]
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
}): Promise<RetrievedDocumentContext> {
  const documentIds = input.documents.map((document) => document.id)

  if (documentIds.length === 0) {
    throw new InsufficientContextError("At least one document is required for retrieval")
  }

  const organizationId = input.documents[0]?.organizationId

  if (!organizationId) {
    throw new InsufficientContextError("Missing organization for document retrieval")
  }

  const hasMixedOrganizations = input.documents.some(
    (document) => document.organizationId !== organizationId
  )

  if (hasMixedOrganizations) {
    throw new InsufficientContextError("Selected documents must belong to the same organization")
  }

  const embeddedChunkRows = await fetchEmbeddedChunksForDocuments({ documentIds, organizationId })

  if (embeddedChunkRows.length === 0) {
    throw new InsufficientContextError("Selected documents have no embedded chunks")
  }

  const contextChunks = mapEmbeddedRowsToRetrievedChunks(embeddedChunkRows)

  return {
    documents: input.documents,
    chunks: contextChunks,
  }
}
