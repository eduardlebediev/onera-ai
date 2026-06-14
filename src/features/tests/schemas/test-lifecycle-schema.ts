import { z } from "zod"

export const TestMetadataUpdateRequestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160, "Title is too long"),
  description: z.string().trim().max(1000, "Description is too long").nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  passingScore: z.coerce
    .number()
    .int("Passing score must be a whole number")
    .min(1, "Passing score must be at least 1")
    .max(100, "Passing score cannot exceed 100"),
  targetRole: z.string().trim().max(120, "Target role is too long").nullable().optional(),
})

export const DeleteTestRequestSchema = z.object({
  deletionReason: z.string().trim().max(1000, "Deletion reason is too long").optional(),
})

export type TestMetadataUpdateRequest = z.infer<typeof TestMetadataUpdateRequestSchema>
export type DeleteTestRequest = z.infer<typeof DeleteTestRequestSchema>
