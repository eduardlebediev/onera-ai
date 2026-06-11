import { z } from "zod"

export const SubmitAttemptRequestSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOptionIds: z.array(z.string().min(1)),
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
