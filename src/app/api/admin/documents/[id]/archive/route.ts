import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isMockDocumentId, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import {
  ARCHIVE_DELETE_MIGRATION_REQUIRED_MESSAGE,
  isArchiveDeleteMigrationError,
} from "@/features/documents/lib/document-archive-delete-schema"
import { ArchiveDocumentError, archiveDocument } from "@/features/documents/lib/document-archive"

interface ArchiveDocumentRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function mapArchiveError(error: ArchiveDocumentError): NextResponse {
  switch (error.code) {
    case "not_found":
      return jsonError(error.message, 404)
    case "deleted":
    case "already_archived":
      return jsonError(error.message, 400)
    default:
      return jsonError(error.message, 400)
  }
}

export async function POST(_request: Request, { params }: ArchiveDocumentRouteContext) {
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

    const result = await archiveDocument({
      organizationId: admin.membership.organizationId,
      documentId,
      archivedBy: admin.userId,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof ArchiveDocumentError) {
      return mapArchiveError(error)
    }

    if (isArchiveDeleteMigrationError(error)) {
      return jsonError(ARCHIVE_DELETE_MIGRATION_REQUIRED_MESSAGE, 409)
    }

    console.error("Archive document API error:", error)
    return jsonError("Could not archive document", 500)
  }
}
