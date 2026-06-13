import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type TestSourceDocumentRecord = {
  documentId: string
  title: string
  status: string
  versionNumber: number | null
  isLatest: boolean
}

type TestDocumentJoinRow = {
  document_id: string
}

type DocumentMetaRow = {
  id: string
  title: string
  status: string
  version_number: number | null
  is_latest: boolean
  replaced_by_document_id: string | null
}

function isMissingTestDocumentsTableError(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? ""

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (message.includes("test_documents") &&
      (message.includes("does not exist") || message.includes("schema cache")))
  )
}

export async function insertTestDocuments(input: {
  testId: string
  organizationId: string
  documentIds: string[]
}): Promise<void> {
  if (input.documentIds.length === 0) {
    return
  }

  const supabase = createAdminClient()

  const rows = input.documentIds.map((documentId) => ({
    test_id: input.testId,
    document_id: documentId,
    organization_id: input.organizationId,
  }))

  const { error } = await supabase.from("test_documents").insert(rows)

  if (error) {
    if (isMissingTestDocumentsTableError(error)) {
      throw new Error(
        "test_documents table is not available. Apply supabase/migrations/00007_multi_document_tests.sql"
      )
    }

    throw new Error(`Failed to insert test_documents rows: ${error.message}`)
  }
}

export async function getTestSourceDocumentsByTestId(input: {
  testId: string
  fallbackSourceDocumentId?: string | null
}): Promise<TestSourceDocumentRecord[]> {
  const supabase = createAdminClient()

  const { data: joins, error: joinError } = await supabase
    .from("test_documents")
    .select("document_id")
    .eq("test_id", input.testId)

  if (joinError) {
    if (isMissingTestDocumentsTableError(joinError)) {
      return loadFallbackSourceDocuments(input.fallbackSourceDocumentId)
    }

    throw new Error(`Failed to fetch test_documents: ${joinError.message}`)
  }

  const documentIds = ((joins ?? []) as TestDocumentJoinRow[]).map((row) => row.document_id)

  if (documentIds.length === 0) {
    return loadFallbackSourceDocuments(input.fallbackSourceDocumentId)
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, title, status, version_number, is_latest, replaced_by_document_id")
    .in("id", documentIds)

  if (documentsError) {
    throw new Error(`Failed to fetch test source documents: ${documentsError.message}`)
  }

  const byId = new Map(((documents ?? []) as DocumentMetaRow[]).map((doc) => [doc.id, doc]))

  return documentIds.flatMap((documentId) => {
    const document = byId.get(documentId)

    if (!document) {
      return []
    }

    return [
      {
        documentId: document.id,
        title: document.title,
        status: document.status,
        versionNumber: document.version_number,
        isLatest: document.is_latest !== false && !document.replaced_by_document_id,
      },
    ]
  })
}

async function loadFallbackSourceDocuments(
  sourceDocumentId?: string | null
): Promise<TestSourceDocumentRecord[]> {
  if (!sourceDocumentId) {
    return []
  }

  const supabase = createAdminClient()

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, status, version_number, is_latest, replaced_by_document_id")
    .eq("id", sourceDocumentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch fallback source document: ${error.message}`)
  }

  if (!document) {
    return []
  }

  return [
    {
      documentId: document.id,
      title: document.title,
      status: document.status,
      versionNumber: document.version_number,
      isLatest: document.is_latest !== false && !document.replaced_by_document_id,
    },
  ]
}

export async function getTestIdsLinkedToDocument(documentId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const testIds = new Set<string>()

  const { data: joinRows, error: joinError } = await supabase
    .from("test_documents")
    .select("test_id")
    .eq("document_id", documentId)

  if (joinError) {
    if (!isMissingTestDocumentsTableError(joinError)) {
      throw new Error(`Failed to fetch test_documents by document: ${joinError.message}`)
    }
  } else {
    for (const row of joinRows ?? []) {
      testIds.add(row.test_id)
    }
  }

  const { data: primaryTests, error: primaryError } = await supabase
    .from("tests")
    .select("id")
    .eq("source_document_id", documentId)

  if (primaryError) {
    throw new Error(`Failed to fetch tests by source_document_id: ${primaryError.message}`)
  }

  for (const test of primaryTests ?? []) {
    testIds.add(test.id)
  }

  return [...testIds]
}
