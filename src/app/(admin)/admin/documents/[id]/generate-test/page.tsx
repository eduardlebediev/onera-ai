import { notFound } from "next/navigation"

import type { MockDocumentDetail } from "@/data/mock/documents"
import { GenerateTestSetup } from "@/features/documents/components/generate-test-setup"
import { canGenerateTest } from "@/features/documents/components/generate-test-model"
import { resolveMockDocumentByRouteId } from "@/features/documents/lib/demo-document-ids"
import {
  getDocumentDetailById,
  getDocumentsFromSupabase,
} from "@/features/documents/lib/supabase-documents"

interface GenerateTestPageProps {
  params: Promise<{ id: string }>
}

function isSelectableDocument(document: MockDocumentDetail): boolean {
  return (
    document.status === "ready" && document.isLatestVersion !== false && canGenerateTest(document)
  )
}

export default async function GenerateTestPage({ params }: GenerateTestPageProps) {
  const { id } = await params

  let document: MockDocumentDetail | undefined
  let selectableDocuments: MockDocumentDetail[] = []

  try {
    document = (await getDocumentDetailById(id)) ?? undefined

    const documentsResult = await getDocumentsFromSupabase()
    selectableDocuments = documentsResult.documents.filter(isSelectableDocument)
  } catch (error) {
    console.error(`Failed to load document ${id} for generate-test:`, error)
  }

  if (!document) {
    document = resolveMockDocumentByRouteId(id)
  }

  if (!document) {
    notFound()
  }

  if (selectableDocuments.length === 0 && isSelectableDocument(document)) {
    selectableDocuments = [document]
  }

  return (
    <GenerateTestSetup
      document={document}
      routeDocumentId={id}
      selectableDocuments={selectableDocuments}
    />
  )
}
