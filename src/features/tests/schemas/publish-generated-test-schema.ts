import { z } from "zod"

import {
  QuestionTypeSchema,
  TestDifficultySchema,
  TestLanguageSchema,
} from "@/features/tests/schemas/generated-test-schema"

export const PublishReviewStatusSchema = z.enum(["approved", "rejected", "needs_edit"])

const PublishTestOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
})

const PublishCorrectAnswerSchema = z.object({
  optionIds: z.array(z.string().min(1)).min(1),
})

export const PublishGeneratedQuestionSchema = z
  .object({
    questionText: z.string().min(1),
    questionType: QuestionTypeSchema,
    options: z.array(PublishTestOptionSchema),
    correctAnswer: PublishCorrectAnswerSchema,
    explanation: z.string().min(1),
    topic: z.string().min(1).optional(),
    difficulty: TestDifficultySchema.optional(),
    sourceChunkId: z.string().uuid().optional(),
    sourceChunkTitle: z.string().min(1).optional(),
    orderIndex: z.number().int().min(0),
    reviewStatus: PublishReviewStatusSchema.optional(),
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

      if (question.correctAnswer.optionIds.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "multiple_choice questions must have at least 1 correct option",
          path: ["correctAnswer", "optionIds"],
        })
      }
    }
  })

export const PublishGeneratedTestRequestSchema = z
  .object({
    generationRunId: z.string().uuid().optional(),
    documentId: z.string().uuid("documentId must be a valid UUID").optional(),
    documentIds: z.array(z.string().uuid()).min(1).max(5).optional(),
    title: z.string().trim().min(3),
    description: z.string().optional(),
    difficulty: TestDifficultySchema,
    language: TestLanguageSchema,
    targetRole: z.string().optional(),
    passingScore: z.number().int().min(0).max(100),
    questions: z.array(PublishGeneratedQuestionSchema).min(1),
  })
  .superRefine((input, ctx) => {
    const hasDocumentId = Boolean(input.documentId)
    const hasDocumentIds = Boolean(input.documentIds && input.documentIds.length > 0)

    if (!hasDocumentId && !hasDocumentIds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either documentId or documentIds is required",
        path: ["documentIds"],
      })
    }

    const saveableQuestions = input.questions.filter(
      (question) => question.reviewStatus !== "rejected"
    )

    if (saveableQuestions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one non-rejected question is required",
        path: ["questions"],
      })
    }

    saveableQuestions.forEach((question, index) => {
      if (!question.sourceChunkId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Approved generated questions must include a source chunk",
          path: ["questions", index, "sourceChunkId"],
        })
      }
    })

    const hasApproved = saveableQuestions.some(
      (question) => question.reviewStatus === "approved" || !question.reviewStatus
    )

    if (!hasApproved) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one approved question is required",
        path: ["questions"],
      })
    }
  })

export const PublishGeneratedTestResponseSchema = z.object({
  testId: z.string().uuid(),
  questionCount: z.number().int().min(1),
  redirectTo: z.string().min(1),
})

export type PublishGeneratedTestRequest = z.infer<typeof PublishGeneratedTestRequestSchema>
export type PublishGeneratedQuestion = z.infer<typeof PublishGeneratedQuestionSchema>
export type PublishGeneratedTestResponse = z.infer<typeof PublishGeneratedTestResponseSchema>

export function normalizePublishDocumentIds(input: {
  documentId?: string
  documentIds?: string[]
}): string[] {
  if (input.documentIds && input.documentIds.length > 0) {
    return [...new Set(input.documentIds)]
  }

  if (input.documentId) {
    return [input.documentId]
  }

  return []
}
