import { NextResponse } from "next/server"

import { AuthError, requireEmployeeApiUser } from "@/features/auth/lib/require-auth"
import { isMockDocumentId, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { createDocumentDownloadUrl } from "@/features/documents/lib/document-download-url"
import { verifyEmployeeCanAccessDocument } from "@/features/employee/documents/lib/verify-employee-document-access"
import { createAdminClient } from "@/lib/supabase/admin"

interface DownloadUrlRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request, { params }: DownloadUrlRouteContext) {
  try {
    const employee = await requireEmployeeApiUser()
    const { id } = await params
    const documentId = resolveApiDocumentId(id)
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get("testId") ?? undefined

    if (!documentId) {
      if (isMockDocumentId(id)) {
        return jsonError("Mock documents use the local demo document flow", 404)
      }

      return jsonError("Invalid document id", 400)
    }

    const hasAccess = await verifyEmployeeCanAccessDocument({
      userId: employee.userId,
      organizationId: employee.membership.organizationId,
      documentId,
      testId,
    })

    if (!hasAccess) {
      return jsonError("Document not found", 404)
    }

    const supabase = createAdminClient()

    const { data: document, error } = await supabase
      .from("documents")
      .select("storage_path, status")
      .eq("id", documentId)
      .eq("organization_id", employee.membership.organizationId)
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

    console.error("Employee document download URL error:", error)
    return jsonError("Could not create download link", 500)
  }
}
