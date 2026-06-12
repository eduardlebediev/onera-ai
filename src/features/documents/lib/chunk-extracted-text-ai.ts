import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

import type { ExtractedTextChunk } from "@/features/documents/lib/chunk-extracted-text"

const TARGET_CHARS = 2800
const MAX_TEXT_PER_CALL = 10000

const AiChunkSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  content: z.string().min(1),
})

const AiChunkingOutputSchema = z.object({
  chunks: z.array(AiChunkSchema).min(1),
})

function buildAiChunkPrompt(text: string, documentTitle: string): string {
  return [
    `Split the following document text into logical learning chunks.`,
    `Document: ${documentTitle}`,
    "",
    "For each chunk:",
    "- title: a short descriptive heading for this section",
    "- topic: the knowledge topic this chunk covers",
    "- content: copy the EXACT original text for this chunk (do not summarize or rewrite)",
    "",
    "Rules:",
    "- Split at meaningful topic boundaries, not mid-paragraph",
    `- Aim for chunks of roughly ${TARGET_CHARS} characters each`,
    "- Prefer complete sections rather than arbitrary cuts",
    "- Reuse the same topic name across chunks that belong to the same broader topic",
    "- Use at most 5-7 distinct topic names across all chunks",
    "- Keep topic names short (1-3 words)",
    "- Do not add or invent content — this is an extraction/split, not a rewrite",
    "- Cover the entire document text",
    "",
    "Text:",
    text,
  ].join("\n")
}

async function chunkTextWithAi(
  text: string,
  documentTitle: string
): Promise<ExtractedTextChunk[] | null> {
  try {
    const result = await generateObject({
      model: openai("gpt-4.1-mini"),
      schema: AiChunkingOutputSchema,
      prompt: buildAiChunkPrompt(text, documentTitle),
    })

    const validated = AiChunkingOutputSchema.safeParse(result.object)

    if (!validated.success || validated.data.chunks.length === 0) {
      return null
    }

    return validated.data.chunks.map((chunk, index) => ({
      chunkIndex: index,
      title: chunk.title,
      topic: chunk.topic,
      content: chunk.content,
      characterCount: chunk.content.length,
    }))
  } catch (error) {
    console.error("AI chunking failed:", error)
    return null
  }
}

export async function chunkExtractedTextAi(
  text: string,
  documentTitle: string
): Promise<ExtractedTextChunk[] | null> {
  if (text.length <= MAX_TEXT_PER_CALL) {
    return chunkTextWithAi(text, documentTitle)
  }

  const segments: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    const end = remaining.length <= MAX_TEXT_PER_CALL ? remaining.length : MAX_TEXT_PER_CALL
    const cutPoint = remaining.lastIndexOf("\n\n", end)
    const sliceEnd = cutPoint > MAX_TEXT_PER_CALL * 0.7 ? cutPoint : end
    segments.push(remaining.slice(0, sliceEnd).trim())
    remaining = remaining.slice(sliceEnd).trim()
  }

  const allChunks: ExtractedTextChunk[] = []

  for (const segment of segments) {
    const segmentChunks = await chunkTextWithAi(segment, documentTitle)
    if (!segmentChunks) return null
    allChunks.push(...segmentChunks)
  }

  return allChunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }))
}
