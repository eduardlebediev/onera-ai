import "server-only"

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/document-file-types"
import { getDocumentImpactSummary } from "@/features/documents/lib/document-impact"
import { invalidateTestsForSourceDocument } from "@/features/tests/lib/test-source-invalidation"
import { createAdminClient } from "@/lib/supabase/admin"

export type DeleteDocumentResult = {
  documentId: string
  status: "deleted"
  impact: Awaited<ReturnType<typeof getDocumentImpactSummary>>
}

type DocumentRow = {
  id: string
  organization_id: string
  source_type: string
  status: string
  storage_path: string | null
}

type SupabaseQueryError = {
  code?: string
  message?: string
}

function isMissingDocumentTopicsTableError(error: SupabaseQueryError): boolean {
  const message = error.message ?? ""

  return (
    error.code === "PGRST205" ||
    (message.includes("document_topics") && message.includes("schema cache"))
  )
}

async function removeStorageObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(DOCUMENTS_STORAGE_BUCKET).remove([storagePath])

  if (error) {
    throw new Error(`Failed to remove document file from storage: ${error.message}`)
  }
}

export async function permanentlyDeleteArchivedDocument(input: {
  organizationId: string
  documentId: string
  deletedBy: string
  deletionReason?: string | null
}): Promise<DeleteDocumentResult> {
  const supabase = createAdminClient()

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, organization_id, source_type, status, storage_path")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (documentError) {
    throw new Error(`Failed to fetch document: ${documentError.message}`)
  }

  if (!document) {
    throw new DeleteDocumentError("Document not found", "not_found")
  }

  const row = document as DocumentRow

  if (row.source_type === "demo") {
    throw new DeleteDocumentError("Demo documents cannot be permanently deleted", "demo")
  }

  if (row.status === "deleted") {
    throw new DeleteDocumentError("Document is already deleted", "already_deleted")
  }

  if (row.status !== "archived") {
    throw new DeleteDocumentError(
      "Only archived documents can be permanently deleted",
      "not_archived"
    )
  }

  const impact = await getDocumentImpactSummary({
    organizationId: input.organizationId,
    documentId: input.documentId,
  })

  if (row.storage_path) {
    await removeStorageObject(row.storage_path)
  }

  const { error: chunksError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (chunksError) {
    throw new Error(`Failed to delete document chunks: ${chunksError.message}`)
  }

  const { error: topicsError } = await supabase
    .from("document_topics")
    .delete()
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (topicsError && !isMissingDocumentTopicsTableError(topicsError)) {
    throw new Error(`Failed to delete document topics: ${topicsError.message}`)
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: "deleted",
      storage_path: null,
      extracted_text: null,
      processing_error: null,
      deleted_at: now,
      deleted_by: input.deletedBy,
      deletion_reason: input.deletionReason?.trim() || null,
    })
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (updateError) {
    throw new Error(`Failed to delete document: ${updateError.message}`)
  }

  await invalidateTestsForSourceDocument({
    organizationId: input.organizationId,
    documentId: input.documentId,
    mode: "deleted",
  })

  return {
    documentId: input.documentId,
    status: "deleted",
    impact,
  }
}

export type DeleteDocumentErrorCode = "not_found" | "demo" | "already_deleted" | "not_archived"

export class DeleteDocumentError extends Error {
  constructor(
    message: string,
    public code: DeleteDocumentErrorCode
  ) {
    super(message)
    this.name = "DeleteDocumentError"
  }
}
