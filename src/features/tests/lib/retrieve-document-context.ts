import OpenAI from "openai"

import { buildRetrievalQuery } from "@/features/tests/lib/generate-test-prompt"
import type { TestDifficulty, TestLanguage } from "@/features/tests/schemas/generated-test-schema"
import { createAdminClient } from "@/lib/supabase/admin"

export const EMBEDDING_MODEL = "text-embedding-3-small"

const MIN_CONTEXT_CHUNKS = 3

export type RetrievedChunk = {
  id: string
  title: string | null
  topic: string | null
  content: string
  similarity: number
}

export type RetrievedDocumentContext = {
  document: {
    id: string
    title: string
    organizationId: string
  }
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
}

export async function fetchDocumentById(documentId: string): Promise<DocumentSummary | null> {
  const supabase = createAdminClient()

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, organization_id")
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
  title: string | null
  topic: string | null
  content: string
  chunk_index: number
}

export function computeMatchCount(questionCount: number): number {
  return Math.min(Math.max(questionCount * 2, 6), 12)
}

async function createQueryEmbedding(openai: OpenAI, query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  })

  const embedding = response.data[0]?.embedding

  if (!embedding || embedding.length === 0) {
    throw new Error("OpenAI returned no embedding")
  }

  return embedding
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
      title: chunk.title,
      topic: chunk.topic,
      content: chunk.content,
      similarity: 0,
    })
  }

  return merged
}

export async function retrieveDocumentContext(input: {
  document: DocumentSummary
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  openai: OpenAI
}): Promise<RetrievedDocumentContext> {
  const supabase = createAdminClient()
  const document = input.document

  const { data: embeddedChunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("id, title, topic, content, chunk_index")
    .eq("document_id", document.id)
    .not("embedding", "is", null)
    .order("chunk_index", { ascending: true })

  if (chunksError) {
    throw new Error(`Failed to fetch embedded chunks: ${chunksError.message}`)
  }

  const embeddedChunkRows = (embeddedChunks ?? []) as EmbeddedChunkRow[]

  if (embeddedChunkRows.length === 0) {
    throw new InsufficientContextError("Document has no embedded chunks")
  }

  if (embeddedChunkRows.length < MIN_CONTEXT_CHUNKS) {
    throw new InsufficientContextError("Document has insufficient embedded chunks for generation")
  }

  const retrievalQuery = buildRetrievalQuery({
    targetRole: input.targetRole,
    difficulty: input.difficulty,
    language: input.language,
  })

  const queryEmbedding = await createQueryEmbedding(input.openai, retrievalQuery)
  const matchCount = computeMatchCount(input.questionCount)

  const { data: rpcMatches, error: rpcError } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    document_id_filter: document.id,
    organization_id_filter: document.organizationId,
    match_threshold: 0.2,
  })

  if (rpcError) {
    throw new Error(`Chunk retrieval failed: ${rpcError.message}`)
  }

  const rpcChunks: RetrievedChunk[] = (rpcMatches ?? []).map((match) => ({
    id: match.id,
    title: match.title,
    topic: match.topic,
    content: match.content,
    similarity: match.similarity,
  }))

  let contextChunks = rpcChunks

  if (contextChunks.length < MIN_CONTEXT_CHUNKS) {
    contextChunks = mergeRetrievedChunks(contextChunks, embeddedChunkRows.slice(0, matchCount))
  }

  if (contextChunks.length < MIN_CONTEXT_CHUNKS) {
    throw new InsufficientContextError("Insufficient context chunks after retrieval fallback")
  }

  return {
    document,
    chunks: contextChunks,
  }
}
