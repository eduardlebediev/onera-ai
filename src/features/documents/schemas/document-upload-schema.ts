import { z } from "zod"

export const UploadDocumentResponseSchema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(["ready", "failed", "processing"]),
  redirectTo: z.string().min(1),
})

export type UploadDocumentResponse = z.infer<typeof UploadDocumentResponseSchema>

export const AffectedDocumentVersionTestSchema = z.object({
  testId: z.string().uuid(),
  title: z.string().min(1),
  status: z.string().min(1),
  questionCount: z.number().int().min(0),
})

export const UploadDocumentVersionResponseSchema = z.object({
  documentId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
  previousDocumentId: z.string().uuid(),
  isLatest: z.literal(true),
  aiChangeSummary: z.string().nullable(),
  affectedTests: z.array(AffectedDocumentVersionTestSchema),
  requiresDecision: z.boolean(),
})

export type UploadDocumentVersionResponse = z.infer<typeof UploadDocumentVersionResponseSchema>

export const DocumentDownloadUrlResponseSchema = z.object({
  signedUrl: z.string().url(),
})

export type DocumentDownloadUrlResponse = z.infer<typeof DocumentDownloadUrlResponseSchema>

export const DocumentImpactAffectedTestSchema = z.object({
  testId: z.string().uuid(),
  title: z.string().min(1),
  status: z.string().min(1),
  sourceValidity: z.string().min(1),
  affectedQuestionCount: z.number().int().min(0),
  activeAssignmentCount: z.number().int().min(0),
  completedAttemptCount: z.number().int().min(0),
})

export const DocumentImpactSummarySchema = z.object({
  documentId: z.string().uuid(),
  affectedTestCount: z.number().int().min(0),
  affectedQuestionCount: z.number().int().min(0),
  activeAssignmentCount: z.number().int().min(0),
  completedAttemptCount: z.number().int().min(0),
  affectedTests: z.array(DocumentImpactAffectedTestSchema),
})

export const ArchiveDocumentResponseSchema = z.object({
  documentId: z.string().uuid(),
  status: z.literal("archived"),
  impact: DocumentImpactSummarySchema,
})

export type ArchiveDocumentResponse = z.infer<typeof ArchiveDocumentResponseSchema>

export const DeleteDocumentResponseSchema = z.object({
  documentId: z.string().uuid(),
  status: z.literal("deleted"),
  impact: DocumentImpactSummarySchema,
})

export type DeleteDocumentResponse = z.infer<typeof DeleteDocumentResponseSchema>
