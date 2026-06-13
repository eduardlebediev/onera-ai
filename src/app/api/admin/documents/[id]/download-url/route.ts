import { NextResponse } from "next/server"

import { isMockDocumentId, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { createDocumentDownloadUrl } from "@/features/documents/lib/document-download-url"
import {
  AuthError,
  requireAdminApiUser,
  verifyDocumentInOrganization,
} from "@/features/auth/lib/require-auth"
import { createAdminClient } from "@/lib/supabase/admin"

interface DownloadUrlRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(_request: Request, { params }: DownloadUrlRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id } = await params
    const documentId = resolveApiDocumentId(id)

    if (!documentId) {
      if (isMockDocumentId(id)) {
        return jsonError("Mock documents use the local demo document flow", 404)
      }

      return jsonError("Invalid document id", 400)
    }

    const documentInOrg = await verifyDocumentInOrganization(
      documentId,
      admin.membership.organizationId
    )

    if (!documentInOrg) {
      return jsonError("Document not found", 404)
    }

    const supabase = createAdminClient()

    const { data: document, error } = await supabase
      .from("documents")
      .select("storage_path, status")
      .eq("id", documentId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load document: ${error.message}`)
    }

    if (!document?.storage_path || document.status === "deleted") {
      return jsonError("Original file is not available for this document", 404)
    }

    const signedUrl = await createDocumentDownloadUrl(document.storage_path)

    return NextResponse.json({ signedUrl })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Document download URL error:", error)
    return jsonError("Could not create download link", 500)
  }
}
