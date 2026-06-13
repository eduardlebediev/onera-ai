import { z } from "zod"

export const SubmitAttemptRequestSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z
    .array(
      z
        .object({
          questionId: z.string().uuid(),
          selectedOptionIds: z.array(z.string().min(1)).optional(),
          openText: z.string().optional(),
        })
        .superRefine((answer, ctx) => {
          const hasOptions = Boolean(
            answer.selectedOptionIds && answer.selectedOptionIds.length > 0
          )
          const hasOpenText = Boolean(answer.openText && answer.openText.trim().length > 0)

          if (!hasOptions && !hasOpenText) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Each answer must include selected options or open text",
            })
          }
        })
    )
    .min(0),
})

export type SubmitAttemptRequest = z.infer<typeof SubmitAttemptRequestSchema>

export const StartAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  testId: z.string().uuid(),
})

export const SubmitAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  redirectTo: z.string(),
})
