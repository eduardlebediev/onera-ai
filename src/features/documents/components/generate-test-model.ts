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
  return document.topics.slice(0, Math.min(document.topics.length, 3))
}

export function getDefaultSelectedChunkIds(
  document: MockDocumentDetail,
  selectedTopics: string[]
): string[] {
  const matchingChunks = document.chunks.filter((chunk) => selectedTopics.includes(chunk.topic))

  if (matchingChunks.length > 0) {
    return matchingChunks.map((chunk) => chunk.id)
  }

  return document.chunks.slice(0, 3).map((chunk) => chunk.id)
}

export function getTopicSummary(document: MockDocumentDetail, topic: string): string {
  const topicChunk = document.chunks.find((chunk) => chunk.topic === topic)

  if (topicChunk) {
    return topicChunk.content
  }

  return "Detected in the source document and available for test generation."
}
