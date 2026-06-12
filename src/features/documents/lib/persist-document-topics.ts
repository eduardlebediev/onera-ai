import "server-only"

import {
  buildFallbackTopicsFromChunks,
  extractDocumentTopics,
  isTopicExtractionOutputError,
} from "@/features/documents/lib/extract-document-topics"
import type { DocumentTopicItem } from "@/features/documents/schemas/document-topics-schema"
import { createAdminClient } from "@/lib/supabase/admin"

export type PersistDocumentTopicsInput = {
  organizationId: string
  documentId: string
  title: string
  extractedText: string
  chunkTopics: string[]
}

export type PersistDocumentTopicsResult = {
  source: "ai" | "chunk"
  topicCount: number
}

async function insertDocumentTopics(input: {
  organizationId: string
  documentId: string
  topics: DocumentTopicItem[]
  source: "ai" | "chunk"
}): Promise<number> {
  if (input.topics.length === 0) {
    return 0
  }

  const supabase = createAdminClient()

  const rows = input.topics.map((topic) => ({
    organization_id: input.organizationId,
    document_id: input.documentId,
    topic: topic.topic,
    description: topic.description,
    confidence: topic.confidence ?? null,
    source: input.source,
  }))

  const { error } = await supabase.from("document_topics").upsert(rows, {
    onConflict: "document_id,topic",
    ignoreDuplicates: false,
  })

  if (error) {
    throw new Error(`Could not save document topics: ${error.message}`)
  }

  return rows.length
}

export async function persistDocumentTopicsBestEffort(
  input: PersistDocumentTopicsInput
): Promise<PersistDocumentTopicsResult> {
  try {
    const aiTopics = await extractDocumentTopics({
      title: input.title,
      extractedText: input.extractedText,
      chunkTopics: input.chunkTopics,
    })

    const topicCount = await insertDocumentTopics({
      organizationId: input.organizationId,
      documentId: input.documentId,
      topics: aiTopics,
      source: "ai",
    })

    return { source: "ai", topicCount }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Topic extraction failed"
    console.error(
      "Document topic extraction failed:",
      isTopicExtractionOutputError(error) ? message : error
    )

    const fallbackTopics = buildFallbackTopicsFromChunks(input.chunkTopics)

    if (fallbackTopics.length === 0) {
      return { source: "chunk", topicCount: 0 }
    }

    try {
      const topicCount = await insertDocumentTopics({
        organizationId: input.organizationId,
        documentId: input.documentId,
        topics: fallbackTopics,
        source: "chunk",
      })

      return { source: "chunk", topicCount }
    } catch (persistError) {
      console.error("Document topic fallback persistence failed:", persistError)
      return { source: "chunk", topicCount: 0 }
    }
  }
}
