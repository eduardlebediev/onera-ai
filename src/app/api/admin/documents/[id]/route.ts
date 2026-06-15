import { NextResponse } from "next/server"
import { z } from "zod"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isMockDocumentId, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import {
  ARCHIVE_DELETE_MIGRATION_REQUIRED_MESSAGE,
  isArchiveDeleteMigrationError,
} from "@/features/documents/lib/document-archive-delete-schema"
import {
  DeleteDocumentError,
  permanentlyDeleteDocumentRecord,
} from "@/features/documents/lib/document-delete"

interface DeleteDocumentRouteContext {
  params: Promise<{ id: string }>
}

const DeleteDocumentBodySchema = z
  .object({
    deletionReason: z.string().trim().max(1000).optional(),
  })
  .optional()

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function mapDeleteError(error: DeleteDocumentError): NextResponse {
  switch (error.code) {
    case "not_found":
      return jsonError(error.message, 404)
    case "already_deleted":
      return jsonError(error.message, 400)
    default:
      return jsonError(error.message, 400)
  }
}

export async function DELETE(request: Request, { params }: DeleteDocumentRouteContext) {
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

    let body: unknown = undefined

    try {
      const text = await request.text()
      if (text.trim().length > 0) {
        body = JSON.parse(text)
      }
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedBody = DeleteDocumentBodySchema.safeParse(body)

    if (!parsedBody.success) {
      const message = parsedBody.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await permanentlyDeleteDocumentRecord({
      organizationId: admin.membership.organizationId,
      documentId,
      deletedBy: admin.userId,
      deletionReason: parsedBody.data?.deletionReason ?? null,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof DeleteDocumentError) {
      return mapDeleteError(error)
    }

    if (isArchiveDeleteMigrationError(error)) {
      return jsonError(ARCHIVE_DELETE_MIGRATION_REQUIRED_MESSAGE, 409)
    }

    console.error("Delete document API error:", error)
    return jsonError("Could not permanently delete document", 500)
  }
}
