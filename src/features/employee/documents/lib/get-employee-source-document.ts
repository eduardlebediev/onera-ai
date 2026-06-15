import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { verifyEmployeeCanAccessDocument } from "./verify-employee-document-access"

export type EmployeeSourceDocumentView = {
  id: string
  title: string
  description: string | null
  extractedText: string | null
  canDownloadOriginal: boolean
  fileName: string | null
}

export async function getEmployeeSourceDocument(input: {
  userId: string
  organizationId: string
  documentId: string
  testId?: string
}): Promise<EmployeeSourceDocumentView | null> {
  const hasAccess = await verifyEmployeeCanAccessDocument(input)

  if (!hasAccess) {
    return null
  }

  const supabase = createAdminClient()

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, description, extracted_text, storage_path, file_name, status")
    .eq("id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load source document: ${error.message}`)
  }

  if (!document || document.status === "deleted") {
    return null
  }

  return {
    id: document.id,
    title: document.title,
    description: document.description,
    extractedText: document.extracted_text?.trim() ? document.extracted_text : null,
    canDownloadOriginal: Boolean(document.storage_path),
    fileName: document.file_name,
  }
}
