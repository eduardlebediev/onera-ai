import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { ingestDocument, storeUploadedDocument } from "@/features/documents/lib/upload-document"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiUser()

    let formData: FormData

    try {
      formData = await request.formData()
    } catch {
      return jsonError("Invalid upload payload", 400)
    }

    const file = formData.get("file")

    if (!(file instanceof File)) {
      return jsonError("A file is required", 400)
    }

    // TODO: Add virus scanning before production uploads are enabled.
    const result = await storeUploadedDocument({
      admin,
      file,
    })

    void ingestDocument({
      documentId: result.documentId,
      organizationId: admin.membership.organizationId,
    }).catch((error) => {
      console.error(`Background document ingestion failed for ${result.documentId}:`, error)
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    const message = error instanceof Error ? error.message : "Upload failed"

    if (
      message.includes("Unsupported") ||
      message.includes("too large") ||
      message.includes("empty") ||
      message.includes("MIME type")
    ) {
      return jsonError(message, 400)
    }

    console.error("Document upload error:", error)
    return jsonError("Upload failed", 500)
  }
}
