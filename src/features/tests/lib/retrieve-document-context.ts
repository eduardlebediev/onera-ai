import "server-only"

import OpenAI from "openai"

import {
  loadChunksByTopicIds,
  loadExplicitChunksByIds,
  type MultiDocumentSummary,
} from "@/features/tests/lib/multi-document-generation"
import { buildRetrievalQuery } from "@/features/tests/lib/generate-test-prompt"
import type { TestDifficulty, TestLanguage } from "@/features/tests/schemas/generated-test-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  createEmbedding,
  EMBEDDING_MODEL,
  serializePgvectorEmbedding,
} from "@/shared/ai/chunk-embeddings"

export { EMBEDDING_MODEL }

const MIN_CONTEXT_CHUNKS = 3

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
  document_id: string
  title: string | null
  topic: string | null
  content: string
  chunk_index: number
}

export function computeMatchCount(questionCount: number, documentCount: number): number {
  const perDocument = Math.min(
    Math.max(Math.ceil(questionCount / Math.max(documentCount, 1)) * 2, 3),
    8
  )
  return Math.min(Math.max(perDocument * documentCount, MIN_CONTEXT_CHUNKS), 16)
}

function mergeRetrievedChunks(
  primary: RetrievedChunk[],
  fallback: EmbeddedChunkRow[]
): RetrievedChunk[] {
  const merged: RetrievedChunk[] = []
  const seen = new Set<string>()

  for (const chunk of primary) {
    if (seen.has(chunk.id)) {
      continue
    }

    seen.add(chunk.id)
    merged.push(chunk)
  }

  for (const chunk of fallback) {
    if (seen.has(chunk.id)) {
      continue
    }

    seen.add(chunk.id)
    merged.push({
      id: chunk.id,
      documentId: chunk.document_id,
      title: chunk.title,
      topic: chunk.topic,
      content: chunk.content,
      similarity: 0,
    })
  }

  return merged
}

async function fetchEmbeddedChunksForDocuments(documentIds: string[]): Promise<EmbeddedChunkRow[]> {
  const supabase = createAdminClient()

  const { data: embeddedChunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("id, document_id, title, topic, content, chunk_index")
    .in("document_id", documentIds)
    .not("embedding", "is", null)
    .order("chunk_index", { ascending: true })

  if (chunksError) {
    throw new Error(`Failed to fetch embedded chunks: ${chunksError.message}`)
  }

  return (embeddedChunks ?? []) as EmbeddedChunkRow[]
}

async function retrieveVectorMatchesForDocument(input: {
  document: MultiDocumentSummary
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  openai: OpenAI
  matchCount: number
}): Promise<RetrievedChunk[]> {
  const supabase = createAdminClient()
  const retrievalQuery = buildRetrievalQuery({
    targetRole: input.targetRole,
    difficulty: input.difficulty,
    language: input.language,
  })

  const queryEmbedding = await createEmbedding(input.openai, retrievalQuery)

  const { data: rpcMatches, error: rpcError } = await supabase.rpc("match_document_chunks", {
    query_embedding: serializePgvectorEmbedding(queryEmbedding),
    match_count: input.matchCount,
    document_id_filter: input.document.id,
    organization_id_filter: input.document.organizationId,
    match_threshold: 0.2,
  })

  if (rpcError) {
    throw new Error(`Chunk retrieval failed: ${rpcError.message}`)
  }

  return (rpcMatches ?? []).map((match) => ({
    id: match.id,
    documentId: match.document_id ?? input.document.id,
    title: match.title,
    topic: match.topic,
    content: match.content,
    similarity: match.similarity,
  }))
}

export async function retrieveDocumentContext(input: {
  document: DocumentSummary
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  openai: OpenAI
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
    openai: input.openai,
  })
}

export async function retrieveMultiDocumentContext(input: {
  documents: MultiDocumentSummary[]
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  openai: OpenAI
  selectedChunkIds?: string[]
  selectedTopicIds?: string[]
}): Promise<RetrievedDocumentContext> {
  const documentIds = input.documents.map((document) => document.id)

  if (documentIds.length === 0) {
    throw new InsufficientContextError("At least one document is required for retrieval")
  }

  const organizationId = input.documents[0]?.organizationId

  if (!organizationId) {
    throw new InsufficientContextError("Missing organization for document retrieval")
  }

  const embeddedChunkRows = await fetchEmbeddedChunksForDocuments(documentIds)

  if (embeddedChunkRows.length === 0) {
    throw new InsufficientContextError("Selected documents have no embedded chunks")
  }

  if (embeddedChunkRows.length < MIN_CONTEXT_CHUNKS && !input.selectedChunkIds?.length) {
    throw new InsufficientContextError(
      "Selected documents have insufficient embedded chunks for generation"
    )
  }

  let contextChunks: RetrievedChunk[] = []

  if (input.selectedChunkIds && input.selectedChunkIds.length > 0) {
    contextChunks = await loadExplicitChunksByIds({
      organizationId,
      documentIds,
      chunkIds: input.selectedChunkIds,
    })
  } else {
    const topicChunkIds =
      input.selectedTopicIds && input.selectedTopicIds.length > 0
        ? await loadChunksByTopicIds({
            organizationId,
            documentIds,
            topicIds: input.selectedTopicIds,
          })
        : []

    if (topicChunkIds.length > 0) {
      contextChunks = await loadExplicitChunksByIds({
        organizationId,
        documentIds,
        chunkIds: topicChunkIds,
      })
    }
  }

  if (contextChunks.length === 0) {
    const matchCount = computeMatchCount(input.questionCount, input.documents.length)
    const perDocumentMatchCount = Math.max(Math.ceil(matchCount / input.documents.length), 2)

    const vectorMatches = await Promise.all(
      input.documents.map((document) =>
        retrieveVectorMatchesForDocument({
          document,
          questionCount: input.questionCount,
          difficulty: input.difficulty,
          language: input.language,
          targetRole: input.targetRole,
          openai: input.openai,
          matchCount: perDocumentMatchCount,
        })
      )
    )

    contextChunks = mergeRetrievedChunks(
      vectorMatches.flat(),
      embeddedChunkRows.slice(0, matchCount)
    )
  }

  if (contextChunks.length < MIN_CONTEXT_CHUNKS) {
    contextChunks = mergeRetrievedChunks(
      contextChunks,
      embeddedChunkRows.slice(0, computeMatchCount(input.questionCount, input.documents.length))
    )
  }

  if (contextChunks.length < MIN_CONTEXT_CHUNKS) {
    throw new InsufficientContextError("Insufficient context chunks after retrieval fallback")
  }

  return {
    documents: input.documents,
    chunks: contextChunks,
  }
}
