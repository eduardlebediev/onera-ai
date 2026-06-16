import type {
  QuestionType,
  TestDifficulty,
  TestLanguage,
} from "@/features/tests/schemas/generated-test-schema"

export type RetrievedChunkForPrompt = {
  id: string
  documentId: string
  documentTitle: string
  title: string | null
  topic: string | null
  content: string
}

type BuildGenerateTestPromptInput = {
  documents: Array<{ id: string; title: string }>
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  questionTypes: QuestionType[]
  chunks: RetrievedChunkForPrompt[]
}

function formatLanguage(language: TestLanguage): string {
  return language === "de" ? "German" : "English"
}

function formatChunk(chunk: RetrievedChunkForPrompt): string {
  const lines = [
    `[Document: ${chunk.documentTitle}]`,
    `[Chunk ID: ${chunk.id}]`,
    `Title: ${chunk.title ?? "(untitled)"}`,
  ]

  if (chunk.topic) {
    lines.push(`[Topic: ${chunk.topic}]`)
  }

  lines.push("Content:", chunk.content)

  return lines.join("\n")
}

export function buildGenerateTestPrompt({
  documents,
  questionCount,
  difficulty,
  language,
  targetRole,
  questionTypes,
  chunks,
}: BuildGenerateTestPromptInput): string {
  const chunkBlocks = chunks.map(formatChunk).join("\n\n---\n\n")
  const supportedTypes = questionTypes.join(", ")
  const documentTitles = documents.map((document) => document.title).join(", ")
  const trueFalseLabels = language === "de" ? "Wahr and Falsch" : "True and False"

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
    `- Supported question types only: ${supportedTypes}.`,
    "- single_choice: exactly 4 options and exactly 1 correct option.",
    "- multiple_choice: exactly 4 options and at least 2 correct options.",
    "- If a question has only one correct option, use single_choice instead of multiple_choice.",
    `- true_false: exactly 2 options (prefer ${trueFalseLabels}) and exactly 1 correct option.`,
    "- open_question: no options; set correctAnswer.expectedAnswer to the model answer text.",
    "- correctAnswer must always include both keys: optionIds and expectedAnswer.",
    "- For objective questions, set correctAnswer.optionIds to the correct option ids and correctAnswer.expectedAnswer to an empty string.",
    "- For open_question, set correctAnswer.optionIds to an empty array and correctAnswer.expectedAnswer to the model answer text.",
    "- Use stable option ids such as opt-a, opt-b, opt-c, opt-d.",
    "- correctAnswer.optionIds must reference existing option ids.",
    "- explanation must be at least 20 characters and grounded in the source chunk.",
    "",
    "Test settings:",
    `- Source documents: ${documentTitles}`,
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
  return `Generate employee knowledge test questions for ${targetRole} from these documents. Difficulty: ${difficulty}. Language: ${language}.`
}
