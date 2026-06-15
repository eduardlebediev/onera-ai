import "server-only"

import OpenAI from "openai"

export const EMBEDDING_MODEL = "text-embedding-3-small"

export function buildEmbeddingInput(input: {
  title?: string | null
  topic?: string | null
  content: string
}): string {
  const lines: string[] = []

  if (input.title?.trim()) {
    lines.push(`Title: ${input.title.trim()}`)
  }

  if (input.topic?.trim()) {
    lines.push(`Topic: ${input.topic.trim()}`)
  }

  lines.push("Content:", input.content)

  return lines.join("\n")
}

export async function createEmbedding(openai: OpenAI, input: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  })

  const embedding = response.data[0]?.embedding

  if (!embedding || embedding.length === 0) {
    throw new Error("OpenAI returned no embedding")
  }

  return embedding
}

export function serializePgvectorEmbedding(embedding: number[]): string {
  return `[${embedding.join(",")}]`
}
