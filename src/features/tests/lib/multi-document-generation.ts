import "server-only"

import type { RetrievedChunk } from "@/features/tests/lib/retrieve-document-context"
import { createAdminClient } from "@/lib/supabase/admin"

export type MultiDocumentSummary = {
  id: string
  title: string
  organizationId: string
}

export { buildSourceLabel } from "@/features/tests/lib/source-label"

export async function loadChunksByTopicIds(input: {
  organizationId: string
  documentIds: string[]
  topicIds: string[]
}): Promise<string[]> {
  if (input.topicIds.length === 0) {
    return []
  }

  const supabase = createAdminClient()

  const { data: topics, error: topicsError } = await supabase
    .from("document_topics")
    .select("id, document_id, topic")
    .eq("organization_id", input.organizationId)
    .in("id", input.topicIds)
    .in("document_id", input.documentIds)

  if (topicsError) {
    const message = topicsError.message ?? ""

    if (topicsError.code === "PGRST205" || message.includes("document_topics")) {
      return loadChunkIdsByTopicNames({
        organizationId: input.organizationId,
        documentIds: input.documentIds,
        topicIds: input.topicIds,
      })
    }

    throw new Error(`Failed to load topic selections: ${topicsError.message}`)
  }

  const topicNames = [...new Set((topics ?? []).map((topic) => topic.topic))]

  if (topicNames.length === 0) {
    return []
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("id")
    .eq("organization_id", input.organizationId)
    .in("document_id", input.documentIds)
    .in("topic", topicNames)

  if (chunksError) {
    throw new Error(`Failed to load chunks for selected topics: ${chunksError.message}`)
  }

  return (chunks ?? []).map((chunk) => chunk.id)
}

async function loadChunkIdsByTopicNames(input: {
  organizationId: string
  documentIds: string[]
  topicIds: string[]
}): Promise<string[]> {
  const supabase = createAdminClient()

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, topic")
    .eq("organization_id", input.organizationId)
    .in("document_id", input.documentIds)
    .in("topic", input.topicIds)

  if (error) {
    throw new Error(`Failed to load chunks for topic fallback: ${error.message}`)
  }

  return (chunks ?? []).map((chunk) => chunk.id)
}

export async function loadExplicitChunksByIds(input: {
  organizationId: string
  documentIds: string[]
  chunkIds: string[]
}): Promise<RetrievedChunk[]> {
  if (input.chunkIds.length === 0) {
    return []
  }

  const supabase = createAdminClient()

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, title, topic, content, chunk_index")
    .eq("organization_id", input.organizationId)
    .in("document_id", input.documentIds)
    .in("id", input.chunkIds)
    .not("embedding", "is", null)
    .order("chunk_index", { ascending: true })

  if (error) {
    throw new Error(`Failed to load selected chunks: ${error.message}`)
  }

  return (chunks ?? []).map((chunk) => ({
    id: chunk.id,
    documentId: chunk.document_id,
    title: chunk.title,
    topic: chunk.topic,
    content: chunk.content,
    similarity: 1,
  }))
}

export function validateGeneratedChunkReferences(input: {
  chunkIds: string[]
  allowedChunkIds: Set<string>
  allowedDocumentIds: Set<string>
  chunkDocumentById: Map<string, string>
}): string | null {
  for (const chunkId of input.chunkIds) {
    if (!input.allowedChunkIds.has(chunkId)) {
      return `Question references unknown sourceChunkId "${chunkId}"`
    }

    const documentId = input.chunkDocumentById.get(chunkId)

    if (!documentId || !input.allowedDocumentIds.has(documentId)) {
      return `Question sourceChunkId "${chunkId}" does not belong to selected documents`
    }
  }

  return null
}
