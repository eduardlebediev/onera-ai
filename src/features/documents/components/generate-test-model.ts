import type { DocumentDetail } from "@/features/documents/types/document"
import type { createTranslator } from "@/shared/i18n/translate"

export type TestDifficulty = "easy" | "medium" | "hard"

export interface GenerateTestSettings {
  title: string
  difficulty: TestDifficulty
  targetRole: string
  targetEmployeeIds: string[]
  questionCount: number
  passingScore: number
}

export const DIFFICULTY_OPTIONS: Array<{ value: TestDifficulty; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

export const ALL_EMPLOYEES_TARGET = "All employees"
export const TARGET_ROLE_OPTIONS = [ALL_EMPLOYEES_TARGET]

export type GenerateTestTargetEmployee = {
  id: string
  name: string
  email: string
  jobTitle: string | null
  department: string | null
}

export function formatEmployeeTarget(
  employee: GenerateTestTargetEmployee,
  allEmployees: GenerateTestTargetEmployee[] = []
): string {
  const duplicateNameCount = allEmployees.filter(
    (candidate) => candidate.name === employee.name
  ).length

  if (duplicateNameCount <= 1) {
    return employee.name
  }

  const qualifier = employee.jobTitle ?? employee.department
  return qualifier ? `${employee.name} (${qualifier})` : employee.name
}

export function formatTargetRoleLabel(
  targetRole: string,
  t: ReturnType<typeof createTranslator>["t"]
): string {
  return targetRole
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean)
    .map((role) => {
      if (role === ALL_EMPLOYEES_TARGET) {
        return t("common.targetRoles.allEmployees")
      }

      const legacyEmailSuffix = role.match(/^(.+?)\s*<[^>]+>$/)
      return legacyEmailSuffix ? legacyEmailSuffix[1].trim() : role
    })
    .join(", ")
}

export const MAX_SELECTABLE_DOCUMENTS = 5

export function canGenerateTest(document: DocumentDetail): boolean {
  const hasEmbeddedChunks = document.hasEmbeddedChunks ?? document.chunks.length > 0

  return document.status === "ready" && document.chunks.length > 0 && hasEmbeddedChunks
}

export function getGenerateBlockReason(
  document: DocumentDetail,
  t: ReturnType<typeof createTranslator>["t"]
): string {
  if (document.status === "archived") {
    return t("documents.generateTest.blockReasons.archived")
  }
  if (document.status === "deleted") {
    return t("documents.generateTest.blockReasons.deleted")
  }
  if (document.status === "processing") {
    return t("documents.generateTest.blockReasons.processing")
  }
  if (document.status === "failed") {
    return t("documents.generateTest.blockReasons.failed")
  }
  if (document.status === "uploaded") {
    return t("documents.generateTest.blockReasons.notProcessed")
  }
  if (document.chunks.length === 0) {
    return t("documents.generateTest.blockReasons.noChunks")
  }
  if (document.hasEmbeddedChunks === false) {
    return t("documents.generateTest.blockReasons.noEmbeddings")
  }
  return t("documents.generateTest.blockReasons.unavailable")
}

/** Derive the unique set of topics represented by the given chunk ids. */
export function deriveTopicsFromChunks(document: DocumentDetail, chunkIds: string[]): string[] {
  const topics = document.chunks
    .filter((chunk) => chunkIds.includes(chunk.id))
    .map((chunk) => chunk.topic)
  return Array.from(new Set(topics))
}

export function getGenerateTestTopics(document: DocumentDetail): string[] {
  return deriveTopicsFromChunks(
    document,
    document.chunks.map((chunk) => chunk.id)
  )
}

export function getDefaultGenerateTestSettings(
  document: DocumentDetail,
  t: ReturnType<typeof createTranslator>["t"]
): GenerateTestSettings {
  return {
    title: t("documents.generateTest.defaultTestTitle", { title: document.title }),
    difficulty: "medium",
    targetRole: ALL_EMPLOYEES_TARGET,
    targetEmployeeIds: [],
    questionCount: Math.min(Math.max(document.chunks.length * 2, 5), 10),
    passingScore: 80,
  }
}

export function getDefaultSelectedTopics(document: DocumentDetail): string[] {
  if (document.chunks.length === 0) return []
  const chunkTopics = getGenerateTestTopics(document)
  return chunkTopics.slice(0, Math.min(chunkTopics.length, 3))
}

export function getDefaultSelectedChunkIds(
  document: DocumentDetail,
  selectedTopics: string[]
): string[] {
  if (document.chunks.length === 0 || selectedTopics.length === 0) return []
  const matchingChunks = document.chunks.filter((chunk) => selectedTopics.includes(chunk.topic))
  return matchingChunks.map((chunk) => chunk.id)
}

export function getTopicSummary(document: DocumentDetail, topic: string): string {
  const topicChunk = document.chunks.find((chunk) => chunk.topic === topic)

  if (topicChunk) {
    return topicChunk.content
  }

  return "Detected in the source document and available for test generation."
}
