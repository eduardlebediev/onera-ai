import { z } from "zod"

const GENERIC_TOPIC_NAMES = new Set([
  "introduction",
  "overview",
  "summary",
  "conclusion",
  "background",
  "general",
  "miscellaneous",
  "other",
  "untitled",
  "section",
])

export const DocumentTopicItemSchema = z.object({
  topic: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1).optional(),
})

export const DocumentTopicsOutputSchema = z
  .object({
    topics: z.array(DocumentTopicItemSchema).min(5).max(10),
  })
  .superRefine((output, ctx) => {
    const seen = new Set<string>()

    for (const [index, item] of output.topics.entries()) {
      const normalized = item.topic.trim().toLowerCase()

      if (GENERIC_TOPIC_NAMES.has(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Topic "${item.topic}" is too generic`,
          path: ["topics", index, "topic"],
        })
      }

      if (seen.has(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate topic "${item.topic}"`,
          path: ["topics", index, "topic"],
        })
      }

      seen.add(normalized)
    }
  })

export type DocumentTopicItem = z.infer<typeof DocumentTopicItemSchema>
export type DocumentTopicsOutput = z.infer<typeof DocumentTopicsOutputSchema>

/** Simpler schema for LLM structured output; validated post-generation. */
export const DocumentTopicsLlmSchema = z.object({
  topics: z.array(
    z.object({
      topic: z.string(),
      description: z.string(),
      confidence: z.number().optional(),
    })
  ),
})

export function normalizeTopicName(topic: string): string {
  return topic.trim().replace(/\s+/g, " ")
}

export function isGenericTopicName(topic: string): boolean {
  const normalized = normalizeTopicName(topic).toLowerCase()
  return GENERIC_TOPIC_NAMES.has(normalized)
}

export function dedupeTopics(topics: DocumentTopicItem[]): DocumentTopicItem[] {
  const seen = new Set<string>()
  const result: DocumentTopicItem[] = []

  for (const item of topics) {
    const normalized = normalizeTopicName(item.topic).toLowerCase()

    if (seen.has(normalized) || isGenericTopicName(item.topic)) {
      continue
    }

    seen.add(normalized)
    result.push({
      ...item,
      topic: normalizeTopicName(item.topic),
    })
  }

  return result
}
