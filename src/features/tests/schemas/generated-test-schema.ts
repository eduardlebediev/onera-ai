import { z } from "zod"

export const TestDifficultySchema = z.enum(["easy", "medium", "hard"])
export const TestLanguageSchema = z.enum(["en", "de"])
export const QuestionTypeSchema = z.enum(["single_choice", "multiple_choice", "true_false"])

export const GenerateTestRequestSchema = z.object({
  documentId: z.string().uuid("documentId must be a valid UUID"),
  questionCount: z.number().int().min(3).max(10).default(5),
  difficulty: TestDifficultySchema.default("medium"),
  language: TestLanguageSchema.default("en"),
  targetRole: z.string().trim().min(1).max(120).default("General employee"),
})

export type GenerateTestRequest = z.infer<typeof GenerateTestRequestSchema>
export type TestDifficulty = z.infer<typeof TestDifficultySchema>
export type TestLanguage = z.infer<typeof TestLanguageSchema>

const GeneratedTestOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
})

const GeneratedTestCorrectAnswerSchema = z.object({
  optionIds: z.array(z.string().min(1)).min(1),
})

export const GeneratedTestQuestionSchema = z
  .object({
    questionText: z.string().min(12),
    questionType: QuestionTypeSchema,
    options: z.array(GeneratedTestOptionSchema),
    correctAnswer: GeneratedTestCorrectAnswerSchema,
    explanation: z.string().min(20),
    topic: z.string().min(1),
    difficulty: TestDifficultySchema,
    sourceChunkId: z.string().uuid(),
    sourceChunkTitle: z.string().min(1),
  })
  .superRefine((question, ctx) => {
    const optionIds = new Set(question.options.map((option) => option.id))

    for (const optionId of question.correctAnswer.optionIds) {
      if (!optionIds.has(optionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `correctAnswer references unknown option id "${optionId}"`,
          path: ["correctAnswer", "optionIds"],
        })
      }
    }

    if (question.questionType === "true_false") {
      if (question.options.length !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "true_false questions must have exactly 2 options",
          path: ["options"],
        })
      }

      if (question.correctAnswer.optionIds.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "true_false questions must have exactly 1 correct option",
          path: ["correctAnswer", "optionIds"],
        })
      }
    }

    if (question.questionType === "single_choice") {
      if (question.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "single_choice questions must have exactly 4 options",
          path: ["options"],
        })
      }

      if (question.correctAnswer.optionIds.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "single_choice questions must have exactly 1 correct option",
          path: ["correctAnswer", "optionIds"],
        })
      }
    }

    if (question.questionType === "multiple_choice") {
      if (question.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "multiple_choice questions must have exactly 4 options",
          path: ["options"],
        })
      }

      if (question.correctAnswer.optionIds.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "multiple_choice questions must have at least 2 correct options",
          path: ["correctAnswer", "optionIds"],
        })
      }
    }
  })

export const GeneratedTestDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: TestDifficultySchema,
  language: TestLanguageSchema,
  targetRole: z.string().min(1),
  passingScore: z.number().int().min(0).max(100).default(70),
  questions: z.array(GeneratedTestQuestionSchema).min(1),
})

export type GeneratedTestDraft = z.infer<typeof GeneratedTestDraftSchema>
export type GeneratedTestQuestion = z.infer<typeof GeneratedTestQuestionSchema>

const GeneratedTestQuestionLlmSchema = z.object({
  questionText: z.string(),
  questionType: QuestionTypeSchema,
  options: z.array(GeneratedTestOptionSchema),
  correctAnswer: GeneratedTestCorrectAnswerSchema,
  explanation: z.string(),
  topic: z.string(),
  difficulty: TestDifficultySchema,
  sourceChunkId: z.string(),
  sourceChunkTitle: z.string(),
})

/** Simpler schema for LLM structured output; validated post-generation with GeneratedTestDraftSchema. */
export const GeneratedTestDraftLlmSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: TestDifficultySchema,
  language: TestLanguageSchema,
  targetRole: z.string(),
  passingScore: z.number(),
  questions: z.array(GeneratedTestQuestionLlmSchema),
})

export const RetrievedChunkSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  topic: z.string().nullable(),
  similarity: z.number(),
})

export const GeneratedTestResponseSchema = z.object({
  generationRunId: z.string().uuid(),
  document: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }),
  draft: GeneratedTestDraftSchema,
  retrievedChunks: z.array(RetrievedChunkSummarySchema),
})

export type GeneratedTestResponse = z.infer<typeof GeneratedTestResponseSchema>

export function validateDraftAgainstRetrievedChunks(
  draft: GeneratedTestDraft,
  retrievedChunkIds: Set<string>,
  expectedQuestionCount: number
): string | null {
  if (draft.questions.length !== expectedQuestionCount) {
    return `Expected ${expectedQuestionCount} questions but received ${draft.questions.length}`
  }

  const questionTexts = new Set<string>()

  for (const question of draft.questions) {
    if (!retrievedChunkIds.has(question.sourceChunkId)) {
      return `Question references unknown sourceChunkId "${question.sourceChunkId}"`
    }

    const normalizedQuestionText = question.questionText.trim().toLowerCase()

    if (questionTexts.has(normalizedQuestionText)) {
      return "Generated draft contains duplicate questions"
    }

    questionTexts.add(normalizedQuestionText)
  }

  return null
}
