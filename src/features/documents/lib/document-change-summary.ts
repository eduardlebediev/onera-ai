import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

export const DOCUMENT_CHANGE_SUMMARY_MODEL = "gpt-4.1-mini"

const MAX_TEXT_CHARS_PER_DOCUMENT = 8_000

const DocumentChangeSummarySchema = z.object({
  summary: z.string().trim().min(1).max(700),
  keyChanges: z.array(z.string().trim().min(1).max(220)).min(1).max(6),
})

export type DocumentChangeSummary = z.infer<typeof DocumentChangeSummarySchema>

function getDocumentChangeSummaryModel(): string {
  return process.env.DOCUMENT_CHANGE_SUMMARY_MODEL?.trim() || DOCUMENT_CHANGE_SUMMARY_MODEL
}

function limitDocumentText(text: string): string {
  const trimmed = text.trim()

  if (trimmed.length <= MAX_TEXT_CHARS_PER_DOCUMENT) {
    return trimmed
  }

  const half = Math.floor(MAX_TEXT_CHARS_PER_DOCUMENT / 2)
  return `${trimmed.slice(0, half)}\n\n[truncated middle]\n\n${trimmed.slice(-half)}`
}

function buildChangeSummaryPrompt(input: {
  previousTitle: string
  previousExtractedText: string
  newExtractedText: string
  changeMessage?: string | null
}): string {
  return [
    "You are comparing two immutable versions of an internal company document.",
    "",
    "Summarize the most important changes for a manager who may need to update employee knowledge tests.",
    "",
    "Rules:",
    "- Use only the provided previous and new text.",
    "- Do not invent changes.",
    "- Be concise.",
    "- Focus on policy, process, responsibility, threshold, and terminology changes.",
    "- If the admin change message is useful, use it as context but verify against the text.",
    "",
    `Document title: ${input.previousTitle}`,
    `Admin change message: ${input.changeMessage?.trim() || "(none)"}`,
    "",
    "Previous version text:",
    limitDocumentText(input.previousExtractedText),
    "",
    "New version text:",
    limitDocumentText(input.newExtractedText),
  ].join("\n")
}

export function formatDocumentChangeSummary(summary: DocumentChangeSummary): string {
  const keyChanges = summary.keyChanges.map((change) => `- ${change}`).join("\n")
  return `${summary.summary}\n\nKey changes:\n${keyChanges}`
}

export async function summarizeDocumentChanges(input: {
  previousTitle: string
  previousExtractedText: string
  newExtractedText: string
  changeMessage?: string | null
}): Promise<DocumentChangeSummary> {
  const result = await generateObject({
    model: openai(getDocumentChangeSummaryModel()),
    schema: DocumentChangeSummarySchema,
    prompt: buildChangeSummaryPrompt(input),
  })

  const parsed = DocumentChangeSummarySchema.safeParse(result.object)

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((issue) => issue.message).join("; ") ||
        "Document change summary failed validation"
    )
  }

  return parsed.data
}

export async function summarizeDocumentChangesBestEffort(input: {
  previousTitle: string
  previousExtractedText: string | null
  newExtractedText: string | null
  changeMessage?: string | null
}): Promise<string | null> {
  if (!input.previousExtractedText?.trim() || !input.newExtractedText?.trim()) {
    return null
  }

  try {
    const summary = await summarizeDocumentChanges({
      previousTitle: input.previousTitle,
      previousExtractedText: input.previousExtractedText,
      newExtractedText: input.newExtractedText,
      changeMessage: input.changeMessage,
    })

    return formatDocumentChangeSummary(summary)
  } catch (error) {
    console.warn("Document change summary failed:", error)
    return null
  }
}
