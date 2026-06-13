import "server-only"

import {
  getSelectableDocumentsByIds,
  MAX_SELECTABLE_DOCUMENTS,
} from "@/features/documents/lib/selectable-documents"
import { createAdminClient } from "@/lib/supabase/admin"

export type ValidatedSourceDocuments = {
  documentIds: string[]
  documents: Array<{
    id: string
    title: string
    organizationId: string
    status: string
  }>
}

export class SourceDocumentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SourceDocumentValidationError"
  }
}

export function normalizeDocumentIds(input: {
  documentId?: string
  documentIds?: string[]
}): string[] {
  if (input.documentIds && input.documentIds.length > 0) {
    return [...new Set(input.documentIds)]
  }

  if (input.documentId) {
    return [input.documentId]
  }

  return []
}

export function assertDocumentIdCount(documentIds: string[]): void {
  if (documentIds.length === 0) {
    throw new SourceDocumentValidationError("At least one document is required")
  }

  if (documentIds.length > MAX_SELECTABLE_DOCUMENTS) {
    throw new SourceDocumentValidationError(
      `A maximum of ${MAX_SELECTABLE_DOCUMENTS} documents can be selected`
    )
  }
}

export async function validateSelectableDocumentsForGeneration(input: {
  organizationId: string
  documentIds: string[]
}): Promise<ValidatedSourceDocuments> {
  assertDocumentIdCount(input.documentIds)

  const supabase = createAdminClient()

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, title, organization_id, status, is_latest")
    .eq("organization_id", input.organizationId)
    .in("id", input.documentIds)

  if (error) {
    throw new Error(`Failed to validate source documents: ${error.message}`)
  }

  const rows = documents ?? []
  const foundIds = new Set(rows.map((doc) => doc.id))

  for (const documentId of input.documentIds) {
    if (!foundIds.has(documentId)) {
      throw new SourceDocumentValidationError(`Document not found: ${documentId}`)
    }
  }

  for (const document of rows) {
    if (document.status === "archived" || document.status === "deleted") {
      throw new SourceDocumentValidationError(
        "Archived or deleted documents cannot be used for test generation"
      )
    }

    if (document.status !== "ready") {
      throw new SourceDocumentValidationError(
        "Only ready documents with embedded chunks can be used for test generation"
      )
    }

    if (document.is_latest !== true) {
      throw new SourceDocumentValidationError(
        "Only the latest version of each document can be selected"
      )
    }
  }

  const selectable = await getSelectableDocumentsByIds({
    organizationId: input.organizationId,
    documentIds: input.documentIds,
  })

  if (selectable.length !== input.documentIds.length) {
    throw new SourceDocumentValidationError(
      "One or more selected documents are missing embedded chunks or are not ready"
    )
  }

  return {
    documentIds: input.documentIds,
    documents: rows.map((document) => ({
      id: document.id,
      title: document.title,
      organizationId: document.organization_id,
      status: document.status,
    })),
  }
}

export async function validateSourceChunkIdsForDocuments(input: {
  organizationId: string
  documentIds: string[]
  chunkIds: string[]
}): Promise<Map<string, string>> {
  const uniqueChunkIds = [...new Set(input.chunkIds.filter(Boolean))]

  if (uniqueChunkIds.length === 0) {
    return new Map()
  }

  const supabase = createAdminClient()

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, document_id")
    .eq("organization_id", input.organizationId)
    .in("id", uniqueChunkIds)

  if (error) {
    throw new Error(`Failed to validate source chunks: ${error.message}`)
  }

  const allowedDocumentIds = new Set(input.documentIds)
  const chunkDocumentById = new Map<string, string>()

  for (const chunk of chunks ?? []) {
    if (!allowedDocumentIds.has(chunk.document_id)) {
      throw new SourceDocumentValidationError(
        `Invalid source chunk reference "${chunk.id}" for selected documents`
      )
    }

    chunkDocumentById.set(chunk.id, chunk.document_id)
  }

  const invalidChunkId = uniqueChunkIds.find((chunkId) => !chunkDocumentById.has(chunkId))

  if (invalidChunkId) {
    throw new SourceDocumentValidationError(`Invalid source chunk reference "${invalidChunkId}"`)
  }

  return chunkDocumentById
}
