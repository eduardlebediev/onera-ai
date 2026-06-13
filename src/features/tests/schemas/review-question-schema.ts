import { z } from "zod"

import {
  QuestionTypeSchema,
  TestDifficultySchema,
} from "@/features/tests/schemas/generated-test-schema"

export const ReviewStatusSchema = z.enum(["needs_review", "approved", "rejected", "edited"])

export const DbReviewStatusSchema = z.enum(["pending", "approved", "rejected", "edited"])

export type ReviewStatus = z.infer<typeof ReviewStatusSchema>
export type DbReviewStatus = z.infer<typeof DbReviewStatusSchema>

export function mapReviewStatusToDb(status: ReviewStatus): DbReviewStatus {
  if (status === "needs_review") return "pending"
  return status
}

export function mapDbReviewStatusToReview(status: string): ReviewStatus {
  if (status === "pending") return "needs_review"
  if (status === "approved" || status === "rejected" || status === "edited") {
    return status
  }

  return "needs_review"
}

const ReviewQuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
})

const ReviewCorrectAnswerSchema = z
  .object({
    optionIds: z.array(z.string().min(1)).optional(),
    expectedAnswer: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasOptionIds = Boolean(value.optionIds && value.optionIds.length > 0)
    const hasExpectedAnswer = Boolean(
      value.expectedAnswer && value.expectedAnswer.trim().length > 0
    )

    if (!hasOptionIds && !hasExpectedAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctAnswer must include optionIds or expectedAnswer",
      })
    }
  })

export const ReviewQuestionPayloadSchema = z
  .object({
    id: z.string().uuid().optional(),
    clientId: z.string().min(1).optional(),
    questionText: z.string().min(1),
    questionType: QuestionTypeSchema,
    options: z.array(ReviewQuestionOptionSchema),
    correctAnswer: ReviewCorrectAnswerSchema,
    explanation: z.string().min(1),
    topic: z.string().min(1),
    difficulty: TestDifficultySchema.default("medium"),
    reviewStatus: ReviewStatusSchema.default("needs_review"),
    sourceChunkId: z.string().uuid().nullable().optional(),
    sourceChunkTitle: z.string().nullable().optional(),
    sourceDocumentId: z.string().uuid().nullable().optional(),
    isAiGenerated: z.boolean().default(true),
    orderIndex: z.number().int().min(0).optional(),
  })
  .superRefine((question, ctx) => {
    if (question.questionType === "open_question") {
      if (question.options.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "open_question must not include options",
          path: ["options"],
        })
      }

      if (!question.correctAnswer.expectedAnswer?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "open_question requires expectedAnswer",
          path: ["correctAnswer", "expectedAnswer"],
        })
      }

      return
    }

    if (question.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one option is required",
        path: ["options"],
      })
    }

    const optionIds = new Set(question.options.map((option) => option.id))
    const correctOptionIds = question.correctAnswer.optionIds ?? []

    if (correctOptionIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one correct option is required",
        path: ["correctAnswer", "optionIds"],
      })
    }

    for (const optionId of correctOptionIds) {
      if (!optionIds.has(optionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `correctAnswer references unknown option id "${optionId}"`,
          path: ["correctAnswer", "optionIds"],
        })
      }
    }
  })

export const PatchReviewQuestionsRequestSchema = z.object({
  upsert: z.array(ReviewQuestionPayloadSchema).optional(),
  deleteIds: z.array(z.string().uuid()).optional(),
})

export type ReviewQuestionPayload = z.infer<typeof ReviewQuestionPayloadSchema>
export type PatchReviewQuestionsRequest = z.infer<typeof PatchReviewQuestionsRequestSchema>
