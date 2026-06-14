import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isMockDocumentId, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { ingestDocument } from "@/features/documents/lib/upload-document"
import { createAdminClient } from "@/lib/supabase/admin"

interface RetryDocumentRouteContext {
  params: Promise<{ id: string }>
}

type RetryDocumentRow = {
  id: string
  organization_id: string
  source_type: string
  status: string
  storage_path: string | null
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(_request: Request, { params }: RetryDocumentRouteContext) {
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

    const supabase = createAdminClient()
    const { data: document, error } = await supabase
      .from("documents")
      .select("id, organization_id, source_type, status, storage_path")
      .eq("id", documentId)
      .eq("organization_id", admin.membership.organizationId)
      .maybeSingle()

    if (error) {
      throw new Error(`Could not load document: ${error.message}`)
    }

    if (!document) {
      return jsonError("Document not found", 404)
    }

    const row = document as RetryDocumentRow

    if (row.source_type === "demo") {
      return jsonError("Demo documents cannot be retried", 400)
    }

    if (row.status !== "failed") {
      return jsonError("Only failed documents can be retried", 400)
    }

    if (!row.storage_path) {
      return jsonError("Stored document file is missing. Please upload the document again.", 409)
    }

    const { error: processingUpdateError } = await supabase
      .from("documents")
      .update({
        status: "processing",
        processing_error: null,
        processed_at: null,
      })
      .eq("id", documentId)
      .eq("organization_id", admin.membership.organizationId)

    if (processingUpdateError) {
      throw new Error(`Could not mark document as processing: ${processingUpdateError.message}`)
    }

    void ingestDocument({
      documentId,
      organizationId: admin.membership.organizationId,
    }).catch((ingestionError) => {
      console.error(`Background document retry failed for ${documentId}:`, ingestionError)
    })

    return NextResponse.json({
      documentId,
      status: "processing",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Retry document API error:", error)
    return jsonError("Could not retry document processing", 500)
  }
}
