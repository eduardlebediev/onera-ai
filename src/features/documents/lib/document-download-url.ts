import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { DOCUMENTS_STORAGE_BUCKET } from "@/features/documents/lib/document-file-types"

const SIGNED_URL_EXPIRY_SECONDS = 60

export async function createDocumentDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error("Could not create a download link for this document")
  }

  return data.signedUrl
}
