import "server-only"

import { MAX_SELECTABLE_DOCUMENTS } from "@/features/documents/components/generate-test-model"
import { createAdminClient } from "@/lib/supabase/admin"

export { MAX_SELECTABLE_DOCUMENTS }

export type SelectableDocumentSummary = {
  id: string
  title: string
  status: string
  versionNumber: number
  isLatest: boolean
  chunkCount: number
  hasEmbeddedChunks: boolean
}

type DocumentRow = {
  id: string
  title: string
  status: string
  version_number: number
  is_latest: boolean
}

type ChunkCountRow = {
  document_id: string
  embedding: unknown | null
}

function hasStoredEmbedding(embedding: unknown | null): boolean {
  if (Array.isArray(embedding)) {
    return embedding.length > 0
  }

  if (typeof embedding === "string") {
    return embedding.trim().length > 0
  }

  return embedding !== null && embedding !== undefined
}

export async function listSelectableDocumentsForOrganization(
  organizationId: string
): Promise<SelectableDocumentSummary[]> {
  const supabase = createAdminClient()

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, title, status, version_number, is_latest")
    .eq("organization_id", organizationId)
    .eq("is_latest", true)
    .eq("status", "ready")
    .order("title", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch selectable documents: ${error.message}`)
  }

  const documentRows = (documents ?? []) as DocumentRow[]

  if (documentRows.length === 0) {
    return []
  }

  const documentIds = documentRows.map((doc) => doc.id)

  const { data: chunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("document_id, embedding")
    .in("document_id", documentIds)

  if (chunksError) {
    throw new Error(`Failed to fetch document chunks for selection: ${chunksError.message}`)
  }

  const chunkStats = new Map<string, { count: number; allEmbedded: boolean }>()

  for (const chunk of (chunks ?? []) as ChunkCountRow[]) {
    const existing = chunkStats.get(chunk.document_id) ?? { count: 0, allEmbedded: true }
    existing.count += 1

    if (!hasStoredEmbedding(chunk.embedding)) {
      existing.allEmbedded = false
    }

    chunkStats.set(chunk.document_id, existing)
  }

  return documentRows
    .map((document) => {
      const stats = chunkStats.get(document.id) ?? { count: 0, allEmbedded: false }

      return {
        id: document.id,
        title: document.title,
        status: document.status,
        versionNumber: document.version_number,
        isLatest: document.is_latest,
        chunkCount: stats.count,
        hasEmbeddedChunks: stats.count > 0 && stats.allEmbedded,
      }
    })
    .filter((document) => document.hasEmbeddedChunks)
}

export async function getSelectableDocumentsByIds(input: {
  organizationId: string
  documentIds: string[]
}): Promise<SelectableDocumentSummary[]> {
  if (input.documentIds.length === 0) {
    return []
  }

  const allSelectable = await listSelectableDocumentsForOrganization(input.organizationId)
  const selectableById = new Map(allSelectable.map((doc) => [doc.id, doc]))

  return input.documentIds.flatMap((documentId) => {
    const document = selectableById.get(documentId)
    return document ? [document] : []
  })
}
