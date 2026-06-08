import type { MockDocumentDetail } from "@/data/mock/documents"

export type TestDifficulty = "easy" | "medium" | "hard"
export type TestLanguage = "en" | "de"

export interface GenerateTestSettings {
  title: string
  difficulty: TestDifficulty
  targetRole: string
  questionCount: number
  language: TestLanguage
  passingScore: number
}

export const DIFFICULTY_OPTIONS: Array<{ value: TestDifficulty; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

export const LANGUAGE_OPTIONS: Array<{ value: TestLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
]

export const TARGET_ROLE_OPTIONS = [
  "All employees",
  "New employees",
  "Engineering team",
  "Customer support",
  "Operations staff",
  "HR team",
]

export function canGenerateTest(document: MockDocumentDetail): boolean {
  return document.status === "ready" && document.chunks.length > 0
}

export function getGenerateBlockReason(document: MockDocumentDetail): string {
  if (document.status === "processing") {
    return "This document is still being processed. Generation will be available once processing is complete."
  }
  if (document.status === "failed") {
    return "Processing failed for this document. Please re-upload or contact support before generating a test."
  }
  if (document.status === "uploaded") {
    return "This document has not been processed yet."
  }
  if (document.chunks.length === 0) {
    return "No content chunks are available for this document."
  }
  return "Test generation is not available for this document."
}

/** Derive the unique set of topics represented by the given chunk ids. */
export function deriveTopicsFromChunks(document: MockDocumentDetail, chunkIds: string[]): string[] {
  const topics = document.chunks
    .filter((chunk) => chunkIds.includes(chunk.id))
    .map((chunk) => chunk.topic)
  return Array.from(new Set(topics))
}

export function getDefaultGenerateTestSettings(document: MockDocumentDetail): GenerateTestSettings {
  return {
    title: `${document.title} Knowledge Test`,
    difficulty: "medium",
    targetRole: TARGET_ROLE_OPTIONS[0],
    questionCount: Math.min(Math.max(document.chunks.length * 2, 5), 10),
    language: "en",
    passingScore: 80,
  }
}

export function getDefaultSelectedTopics(document: MockDocumentDetail): string[] {
  if (document.chunks.length === 0) return []
  return document.topics.slice(0, Math.min(document.topics.length, 3))
}

export function getDefaultSelectedChunkIds(
  document: MockDocumentDetail,
  selectedTopics: string[]
): string[] {
  if (document.chunks.length === 0 || selectedTopics.length === 0) return []
  const matchingChunks = document.chunks.filter((chunk) => selectedTopics.includes(chunk.topic))
  return matchingChunks.map((chunk) => chunk.id)
}

export function getTopicSummary(document: MockDocumentDetail, topic: string): string {
  const topicChunk = document.chunks.find((chunk) => chunk.topic === topic)

  if (topicChunk) {
    return topicChunk.content
  }

  return "Detected in the source document and available for test generation."
}
