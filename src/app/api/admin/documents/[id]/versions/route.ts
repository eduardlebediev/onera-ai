import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isMockDocumentId, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { getAffectedTestsForDocumentVersion } from "@/features/documents/lib/document-affected-tests"
import { summarizeDocumentChangesBestEffort } from "@/features/documents/lib/document-change-summary"
import { createDocumentVersionEvent } from "@/features/documents/lib/document-version-events"
import {
  getDocumentRootId,
  getDocumentVersionFamily,
  getLatestDocumentVersion,
} from "@/features/documents/lib/document-versioning"
import {
  prepareDocumentUploadFile,
  processDocumentUploadForDocument,
} from "@/features/documents/lib/upload-document"
import { createAdminClient } from "@/lib/supabase/admin"

interface DocumentVersionsRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function normalizeChangeMessage(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 1_000) : null
}

function isUploadValidationError(message: string): boolean {
  return (
    message.includes("Unsupported") ||
    message.includes("too large") ||
    message.includes("empty") ||
    message.includes("MIME type")
  )
}

export async function POST(request: Request, { params }: DocumentVersionsRouteContext) {
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

    const changeMessage = normalizeChangeMessage(formData.get("changeMessage"))
    const family = await getDocumentVersionFamily(documentId)

    if (!family) {
      return jsonError("Document not found", 404)
    }

    const sourceDocument = family.versions.find((version) => version.id === documentId)

    if (!sourceDocument || sourceDocument.organization_id !== admin.membership.organizationId) {
      return jsonError("Document not found", 404)
    }

    if (sourceDocument.source_type === "demo") {
      return jsonError("Demo documents cannot receive uploaded versions", 400)
    }

    const latestVersion = await getLatestDocumentVersion(
      family.rootDocumentId,
      admin.membership.organizationId
    )

    if (!latestVersion) {
      return jsonError("Latest document version not found", 404)
    }

    if (latestVersion.source_type !== "upload") {
      return jsonError("Only uploaded documents can receive new versions", 400)
    }

    const preparedFile = await prepareDocumentUploadFile(file)
    const supabase = createAdminClient()
    const rootDocumentId = getDocumentRootId(latestVersion)
    const nextVersionNumber =
      Math.max(
        ...family.versions.map((version) => version.version_number),
        latestVersion.version_number
      ) + 1

    const { data: newDocument, error: createError } = await supabase
      .from("documents")
      .insert({
        organization_id: admin.membership.organizationId,
        title: latestVersion.title,
        description: latestVersion.description ?? `Uploaded document: ${preparedFile.safeFileName}`,
        source_type: "upload",
        file_name: preparedFile.safeFileName,
        file_type: preparedFile.extension,
        file_size_mb: preparedFile.fileSizeMb,
        status: "processing",
        extraction_method: preparedFile.extractionMethod,
        created_by: admin.userId,
        parent_document_id: rootDocumentId,
        version_number: nextVersionNumber,
        is_latest: false,
        replaced_by_document_id: null,
        change_message: changeMessage,
      })
      .select("id")
      .single()

    if (createError || !newDocument) {
      throw new Error(createError?.message ?? "Could not create document version")
    }

    const processingResult = await processDocumentUploadForDocument({
      documentId: newDocument.id,
      organizationId: admin.membership.organizationId,
      preparedFile,
    })

    if (processingResult.status === "failed") {
      return jsonError(processingResult.processingError, 500)
    }

    const aiChangeSummary = await summarizeDocumentChangesBestEffort({
      previousTitle: latestVersion.title,
      previousExtractedText: latestVersion.extracted_text,
      newExtractedText: processingResult.extractedText,
      changeMessage,
    })

    const { error: previousUpdateError } = await supabase
      .from("documents")
      .update({
        is_latest: false,
        replaced_by_document_id: newDocument.id,
      })
      .eq("id", latestVersion.id)
      .eq("organization_id", admin.membership.organizationId)

    if (previousUpdateError) {
      throw new Error(`Could not update previous document version: ${previousUpdateError.message}`)
    }

    const { error: latestUpdateError } = await supabase
      .from("documents")
      .update({
        is_latest: true,
        ai_change_summary: aiChangeSummary,
      })
      .eq("id", newDocument.id)
      .eq("organization_id", admin.membership.organizationId)

    if (latestUpdateError) {
      throw new Error(`Could not finalize document version metadata: ${latestUpdateError.message}`)
    }

    await createDocumentVersionEvent({
      organizationId: admin.membership.organizationId,
      documentId: newDocument.id,
      previousDocumentId: latestVersion.id,
      eventType: "new_version",
      createdBy: admin.userId,
      changeMessage,
      aiChangeSummary,
    })

    const affectedTests = await getAffectedTestsForDocumentVersion({
      organizationId: admin.membership.organizationId,
      documentId: latestVersion.id,
    })

    return NextResponse.json({
      documentId: newDocument.id,
      versionNumber: nextVersionNumber,
      previousDocumentId: latestVersion.id,
      isLatest: true,
      aiChangeSummary,
      affectedTests,
      requiresDecision: affectedTests.length > 0,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    const message = error instanceof Error ? error.message : "Version upload failed"

    if (isUploadValidationError(message)) {
      return jsonError(message, 400)
    }

    console.error("Document version upload error:", error)
    return jsonError("Version upload failed", 500)
  }
}
