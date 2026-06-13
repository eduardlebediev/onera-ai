import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type DocumentVersionEventType = "initial_upload" | "new_version"

export async function createDocumentVersionEvent(input: {
  organizationId: string
  documentId: string
  previousDocumentId?: string | null
  eventType: DocumentVersionEventType
  createdBy?: string | null
  changeMessage?: string | null
  aiChangeSummary?: string | null
}): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from("document_version_events").insert({
    organization_id: input.organizationId,
    document_id: input.documentId,
    previous_document_id: input.previousDocumentId ?? null,
    event_type: input.eventType,
    created_by: input.createdBy ?? null,
    change_message: input.changeMessage ?? null,
    ai_change_summary: input.aiChangeSummary ?? null,
  })

  if (error) {
    throw new Error(`Failed to create document version event: ${error.message}`)
  }
}
