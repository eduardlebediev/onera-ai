import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type DocumentVersionRow = {
  id: string
  organization_id: string
  title: string
  description: string | null
  source_type: string
  file_name: string | null
  file_type: string | null
  file_size_mb: number | null
  status: string
  extracted_text: string | null
  storage_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  parent_document_id: string | null
  version_number: number
  is_latest: boolean
  replaced_by_document_id: string | null
  change_message: string | null
  ai_change_summary: string | null
}

export type DocumentVersionFamily = {
  rootDocumentId: string
  versions: DocumentVersionRow[]
}

const DOCUMENT_VERSION_SELECT = [
  "id",
  "organization_id",
  "title",
  "description",
  "source_type",
  "file_name",
  "file_type",
  "file_size_mb",
  "status",
  "extracted_text",
  "storage_path",
  "created_by",
  "created_at",
  "updated_at",
  "parent_document_id",
  "version_number",
  "is_latest",
  "replaced_by_document_id",
  "change_message",
  "ai_change_summary",
].join(", ")

export function getDocumentRootId(document: Pick<DocumentVersionRow, "id" | "parent_document_id">) {
  return document.parent_document_id ?? document.id
}

export async function getDocumentVersionById(
  documentId: string
): Promise<DocumentVersionRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_VERSION_SELECT)
    .eq("id", documentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch document version: ${error.message}`)
  }

  return (data as DocumentVersionRow | null) ?? null
}

export async function getDocumentVersionFamily(
  documentId: string
): Promise<DocumentVersionFamily | null> {
  const document = await getDocumentVersionById(documentId)

  if (!document) {
    return null
  }

  const rootDocumentId = getDocumentRootId(document)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_VERSION_SELECT)
    .eq("organization_id", document.organization_id)
    .or(`id.eq.${rootDocumentId},parent_document_id.eq.${rootDocumentId}`)
    .order("version_number", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch document version family: ${error.message}`)
  }

  return {
    rootDocumentId,
    versions: (data ?? []) as unknown as DocumentVersionRow[],
  }
}

export async function getLatestDocumentVersion(
  rootDocumentId: string,
  organizationId: string
): Promise<DocumentVersionRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_VERSION_SELECT)
    .eq("organization_id", organizationId)
    .or(`id.eq.${rootDocumentId},parent_document_id.eq.${rootDocumentId}`)
    .eq("is_latest", true)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch latest document version: ${error.message}`)
  }

  return (data as DocumentVersionRow | null) ?? null
}

export async function getLatestDocumentVersionForDocument(
  documentId: string
): Promise<DocumentVersionRow | null> {
  const document = await getDocumentVersionById(documentId)

  if (!document) {
    return null
  }

  return getLatestDocumentVersion(getDocumentRootId(document), document.organization_id)
}

export async function getLatestReadyDocumentVersionForDocument(
  documentId: string
): Promise<DocumentVersionRow | null> {
  const latest = await getLatestDocumentVersionForDocument(documentId)

  if (!latest || latest.status !== "ready") {
    return null
  }

  return latest
}
