import { z } from "zod"

export const UploadDocumentResponseSchema = z.object({
  documentId: z.string().uuid(),
  status: z.enum(["ready", "failed", "processing"]),
  redirectTo: z.string().min(1),
})

export type UploadDocumentResponse = z.infer<typeof UploadDocumentResponseSchema>

export const DocumentDownloadUrlResponseSchema = z.object({
  signedUrl: z.string().url(),
})

export type DocumentDownloadUrlResponse = z.infer<typeof DocumentDownloadUrlResponseSchema>
