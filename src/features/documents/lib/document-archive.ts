import "server-only"

import { getDocumentImpactSummary } from "@/features/documents/lib/document-impact"
import { invalidateTestsForSourceDocument } from "@/features/tests/lib/test-source-invalidation"
import { createAdminClient } from "@/lib/supabase/admin"

export type ArchiveDocumentResult = {
  documentId: string
  status: "archived"
  impact: Awaited<ReturnType<typeof getDocumentImpactSummary>>
}

type DocumentRow = {
  id: string
  organization_id: string
  status: string
}

export async function archiveDocument(input: {
  organizationId: string
  documentId: string
  archivedBy: string
}): Promise<ArchiveDocumentResult> {
  const supabase = createAdminClient()

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, organization_id, status")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (documentError) {
    throw new Error(`Failed to fetch document: ${documentError.message}`)
  }

  if (!document) {
    throw new ArchiveDocumentError("Document not found", "not_found")
  }

  const row = document as DocumentRow

  if (row.status === "deleted") {
    throw new ArchiveDocumentError("Deleted documents cannot be archived", "deleted")
  }

  if (row.status === "archived") {
    throw new ArchiveDocumentError("Document is already archived", "already_archived")
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: "archived",
      archived_at: now,
      archived_by: input.archivedBy,
    })
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)

  if (updateError) {
    throw new Error(`Failed to archive document: ${updateError.message}`)
  }

  await invalidateTestsForSourceDocument({
    organizationId: input.organizationId,
    documentId: input.documentId,
    mode: "archived",
  })

  const impact = await getDocumentImpactSummary({
    organizationId: input.organizationId,
    documentId: input.documentId,
  })

  return {
    documentId: input.documentId,
    status: "archived",
    impact,
  }
}

export type ArchiveDocumentErrorCode = "not_found" | "deleted" | "already_archived"

export class ArchiveDocumentError extends Error {
  constructor(
    message: string,
    public code: ArchiveDocumentErrorCode
  ) {
    super(message)
    this.name = "ArchiveDocumentError"
  }
}
