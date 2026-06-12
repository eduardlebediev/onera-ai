import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject, JSONParseError, NoObjectGeneratedError, TypeValidationError } from "ai"

import {
  dedupeTopics,
  DocumentTopicsLlmSchema,
  DocumentTopicsOutputSchema,
  isGenericTopicName,
  normalizeTopicName,
  type DocumentTopicItem,
} from "@/features/documents/schemas/document-topics-schema"

export const TOPIC_EXTRACTION_MODEL = "gpt-4.1-mini"

function getTopicExtractionModel(): string {
  return process.env.DOCUMENT_TOPIC_EXTRACTION_MODEL?.trim() || TOPIC_EXTRACTION_MODEL
}

function buildTopicExtractionPrompt(input: {
  title: string
  extractedText: string
  chunkTopics: string[]
}): string {
  const chunkTopicsBlock =
    input.chunkTopics.length > 0
      ? input.chunkTopics.map((topic) => `- ${topic}`).join("\n")
      : "(none)"

  const textPreview =
    input.extractedText.length > 12_000
      ? `${input.extractedText.slice(0, 12_000)}\n\n[truncated]`
      : input.extractedText

  return [
    "You are an expert learning content analyst.",
    "",
    "Extract key learning topics from the document below.",
    "",
    "Rules:",
    "- Return at most 10 learning topics. Definitely no more than 10.",
    "- Each topic must be a specific learning concept, not a generic section label.",
    "- Do not use generic topics such as Introduction, Overview, Summary, or Conclusion.",
    "- Merge related sections into broad topics — do not create one topic per section.",
    "- Deduplicate topic names.",
    "- Keep topic names short (1-4 words).",
    "- description should explain what an employee should learn about that topic (1-2 sentences).",
    "- confidence is optional between 0 and 1 indicating how strongly the topic is supported by the document.",
    "",
    `Document title: ${input.title}`,
    "",
    "Chunk section topics (for context):",
    chunkTopicsBlock,
    "",
    "Document text:",
    textPreview,
  ].join("\n")
}

export function buildFallbackTopicsFromChunks(chunkTopics: string[]): DocumentTopicItem[] {
  const uniqueTopics = Array.from(
    new Set(
      chunkTopics
        .map(normalizeTopicName)
        .filter(
          (topic) =>
            topic.length > 0 && !/^section\s+\d+$/i.test(topic) && !isGenericTopicName(topic)
        )
    )
  )

  return uniqueTopics.slice(0, 10).map((topic) => ({
    topic,
    description: `Content related to ${topic}.`,
  }))
}

export function isTopicExtractionOutputError(error: unknown): boolean {
  return (
    error instanceof JSONParseError ||
    error instanceof NoObjectGeneratedError ||
    error instanceof TypeValidationError
  )
}

export async function extractDocumentTopics(input: {
  title: string
  extractedText: string
  chunkTopics: string[]
}): Promise<DocumentTopicItem[]> {
  const prompt = buildTopicExtractionPrompt(input)

  const result = await generateObject({
    model: openai(getTopicExtractionModel()),
    schema: DocumentTopicsLlmSchema,
    prompt,
  })

  const validated = DocumentTopicsOutputSchema.safeParse(result.object)

  if (!validated.success) {
    throw new Error(
      validated.error.issues.map((issue) => issue.message).join("; ") ||
        "Topic extraction output failed validation"
    )
  }

  const deduped = dedupeTopics(validated.data.topics)

  if (deduped.length === 0) {
    throw new Error("No valid topics remained after normalization")
  }

  return deduped.slice(0, 10)
}
