import type { TestDifficulty, TestLanguage } from "@/features/tests/schemas/generated-test-schema"

export type RetrievedChunkForPrompt = {
  id: string
  title: string | null
  topic: string | null
  content: string
}

type BuildGenerateTestPromptInput = {
  documentTitle: string
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  chunks: RetrievedChunkForPrompt[]
}

function formatLanguage(language: TestLanguage): string {
  return language === "de" ? "German" : "English"
}

function formatChunk(chunk: RetrievedChunkForPrompt): string {
  const lines = [`[Chunk ID: ${chunk.id}]`, `Title: ${chunk.title ?? "(untitled)"}`]

  if (chunk.topic) {
    lines.push(`Topic: ${chunk.topic}`)
  }

  lines.push("Content:", chunk.content)

  return lines.join("\n")
}

export function buildGenerateTestPrompt({
  documentTitle,
  questionCount,
  difficulty,
  language,
  targetRole,
  chunks,
}: BuildGenerateTestPromptInput): string {
  const chunkBlocks = chunks.map(formatChunk).join("\n\n---\n\n")

  return [
    "You are an expert employee knowledge test author.",
    "",
    "Generate a structured employee knowledge test draft using ONLY the document chunks provided below.",
    "",
    "Hard rules:",
    "- Use only the provided document chunks as your knowledge source.",
    "- Do not invent company policies, procedures, or facts that are not supported by the chunks.",
    "- Every question must be answerable from at least one provided chunk.",
    "- Every question must include sourceChunkId matching one of the provided chunk IDs.",
    "- Every question must include sourceChunkTitle matching the title of the referenced chunk.",
    "- Avoid duplicate or near-duplicate questions.",
    "- Return exactly the requested number of questions.",
    "- Prefer practical employee scenarios over trivia.",
    "- Supported question types only: single_choice, multiple_choice, true_false.",
    "- single_choice: exactly 4 options and exactly 1 correct option.",
    "- multiple_choice: exactly 4 options and at least 2 correct options.",
    "- true_false: exactly 2 options (prefer True and False) and exactly 1 correct option.",
    "- Use stable option ids such as opt-a, opt-b, opt-c, opt-d.",
    "- correctAnswer.optionIds must reference existing option ids.",
    "- explanation must be at least 20 characters and grounded in the source chunk.",
    "",
    "Test settings:",
    `- Document title: ${documentTitle}`,
    `- Target role: ${targetRole}`,
    `- Difficulty: ${difficulty}`,
    `- Language: ${formatLanguage(language)} (${language})`,
    `- Requested question count: ${questionCount}`,
    "",
    "Document chunks:",
    chunkBlocks,
  ].join("\n")
}

export function buildRetrievalQuery({
  targetRole,
  difficulty,
  language,
}: Pick<BuildGenerateTestPromptInput, "targetRole" | "difficulty" | "language">): string {
  return `Generate employee knowledge test questions for ${targetRole} from this document. Difficulty: ${difficulty}. Language: ${language}.`
}
