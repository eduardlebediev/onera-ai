import "server-only"

import OpenAI from "openai"

import type { ExtractedTextChunk } from "@/features/documents/lib/chunk-extracted-text"
import type { SupportedUploadExtension } from "@/features/documents/lib/document-file-types"
import { getExtractionMethod } from "@/features/documents/lib/document-file-types"
import { buildEmbeddingInput, createEmbedding, EMBEDDING_MODEL } from "@/shared/ai/chunk-embeddings"
import type { Json } from "@/lib/supabase/types"

export type EmbeddedDocumentChunk = ExtractedTextChunk & {
  embedding: number[]
  metadata: Json
}

export async function embedDocumentChunks(input: {
  chunks: ExtractedTextChunk[]
  fileType: SupportedUploadExtension
  openai: OpenAI
}): Promise<EmbeddedDocumentChunk[]> {
  const extractionMethod = getExtractionMethod(input.fileType)
  const embedded: EmbeddedDocumentChunk[] = []

  for (const chunk of input.chunks) {
    const embeddingInput = buildEmbeddingInput({
      title: chunk.title,
      topic: chunk.topic,
      content: chunk.content,
    })

    const embedding = await createEmbedding(input.openai, embeddingInput)

    embedded.push({
      ...chunk,
      embedding,
      metadata: {
        source: "upload",
        extraction_method: extractionMethod,
        file_type: input.fileType,
        character_count: chunk.characterCount,
        embedding_model: EMBEDDING_MODEL,
        embedded_at: new Date().toISOString(),
      },
    })
  }

  return embedded
}
