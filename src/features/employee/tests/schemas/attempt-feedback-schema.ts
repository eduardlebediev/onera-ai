import { z } from "zod"

export const AttemptFeedbackOutputSchema = z.object({
  performanceSummary: z.string().trim().min(1).max(600),
  understoodWell: z.string().trim().min(1).max(600),
  needsImprovement: z.string().trim().min(1).max(600),
  recommendedNextStep: z.string().trim().min(1).max(600),
})

export type AttemptFeedbackOutput = z.infer<typeof AttemptFeedbackOutputSchema>

/** Simpler schema for LLM structured output; validated post-generation. */
export const AttemptFeedbackLlmSchema = z.object({
  performanceSummary: z.string(),
  understoodWell: z.string(),
  needsImprovement: z.string(),
  recommendedNextStep: z.string(),
})

export const ATTEMPT_FEEDBACK_ENVELOPE_VERSION = 1

export const AttemptFeedbackEnvelopeSchema = z.object({
  version: z.literal(ATTEMPT_FEEDBACK_ENVELOPE_VERSION),
  feedback: AttemptFeedbackOutputSchema,
})

export type AttemptFeedbackEnvelope = z.infer<typeof AttemptFeedbackEnvelopeSchema>

export function serializeAttemptFeedbackEnvelope(feedback: AttemptFeedbackOutput): string {
  const envelope: AttemptFeedbackEnvelope = {
    version: ATTEMPT_FEEDBACK_ENVELOPE_VERSION,
    feedback,
  }

  return JSON.stringify(envelope)
}

export function parseAttemptFeedbackEnvelope(
  raw: string | null | undefined
): AttemptFeedbackOutput | null {
  if (!raw?.trim()) {
    return null
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const validated = AttemptFeedbackEnvelopeSchema.safeParse(parsed)

  if (!validated.success) {
    return null
  }

  return validated.data.feedback
}
