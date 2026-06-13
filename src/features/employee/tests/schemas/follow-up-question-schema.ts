import { z } from "zod"

export const FollowUpDifficultySchema = z.enum(["easy", "medium", "hard"])

export const FollowUpQuestionOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(220),
})

export const FollowUpQuestionOutputSchema = z
  .object({
    id: z.string().trim().min(1),
    originalQuestionId: z.string().trim().min(1),
    topic: z.string().trim().min(1).max(120),
    sourceChunkReference: z.string().trim().min(1).max(160),
    explanationBeforeQuestion: z.string().trim().min(20).max(700),
    questionText: z.string().trim().min(12).max(500),
    options: z.array(FollowUpQuestionOptionSchema).length(4),
    correctOptionId: z.string().trim().min(1),
    explanationAfterAnswer: z.string().trim().min(20).max(700),
    learningGoal: z.string().trim().min(8).max(180),
    difficulty: FollowUpDifficultySchema,
  })
  .superRefine((question, ctx) => {
    const optionIds = new Set(question.options.map((option) => option.id))

    if (!optionIds.has(question.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctOptionId must reference one of the option ids",
        path: ["correctOptionId"],
      })
    }
  })

export type FollowUpQuestionOutput = z.infer<typeof FollowUpQuestionOutputSchema>

export const FollowUpQuestionLlmSchema = z.object({
  explanationBeforeQuestion: z.string(),
  questionText: z.string(),
  options: z.array(z.object({ label: z.string() })).length(4),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanationAfterAnswer: z.string(),
  learningGoal: z.string(),
  difficulty: FollowUpDifficultySchema,
})

export const GenerateFollowUpQuestionRequestSchema = z.object({
  attemptId: z.string().uuid("attemptId must be a valid UUID"),
  questionId: z.string().uuid("questionId must be a valid UUID"),
})

export type GenerateFollowUpQuestionRequest = z.infer<typeof GenerateFollowUpQuestionRequestSchema>
