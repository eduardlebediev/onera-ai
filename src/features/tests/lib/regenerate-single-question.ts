import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

import type { GeneratedTestQuestion } from "@/features/tests/schemas/generated-test-schema"
import {
  GeneratedTestQuestionSchema,
  QuestionTypeSchema,
  TestDifficultySchema,
} from "@/features/tests/schemas/generated-test-schema"
import {
  buildGenerateTestPrompt,
  type RetrievedChunkForPrompt,
} from "@/features/tests/lib/generate-test-prompt"
import { GENERATION_MODEL } from "@/app/api/admin/generate-test/route"

const SingleQuestionLlmSchema = z.object({
  questionText: z.string(),
  questionType: QuestionTypeSchema,
  options: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
    })
  ),
  correctAnswer: z.object({
    optionIds: z.array(z.string().min(1)).optional(),
    expectedAnswer: z.string().min(1).optional(),
  }),
  explanation: z.string(),
  topic: z.string(),
  difficulty: TestDifficultySchema,
  sourceChunkId: z.string(),
  sourceChunkTitle: z.string(),
})

export async function regenerateSingleQuestion(input: {
  questionType: z.infer<typeof QuestionTypeSchema>
  topic: string
  difficulty: z.infer<typeof TestDifficultySchema>
  language: "en" | "de"
  targetRole: string
  chunk: RetrievedChunkForPrompt
  documents: Array<{ id: string; title: string }>
}): Promise<GeneratedTestQuestion | null> {
  const prompt = [
    buildGenerateTestPrompt({
      documents: input.documents,
      questionCount: 1,
      difficulty: input.difficulty,
      language: input.language,
      targetRole: input.targetRole,
      questionTypes: [input.questionType],
      chunks: [input.chunk],
    }),
    "",
    "Generate exactly ONE replacement question.",
    `Required topic: ${input.topic}`,
    `Required question type: ${input.questionType}`,
    `Required source chunk id: ${input.chunk.id}`,
  ].join("\n")

  try {
    const result = await generateObject({
      model: openai(GENERATION_MODEL),
      schema: SingleQuestionLlmSchema,
      prompt,
    })

    const normalized: GeneratedTestQuestion = {
      ...result.object,
      sourceDocumentId: input.chunk.documentId,
      sourceDocumentTitle: input.chunk.documentTitle,
    }

    const validated = GeneratedTestQuestionSchema.safeParse(normalized)
    return validated.success ? validated.data : null
  } catch (error) {
    console.warn("Single question regeneration failed:", error)
    return null
  }
}
