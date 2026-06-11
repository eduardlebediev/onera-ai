import { notFound } from "next/navigation"

import { mockDocuments } from "@/data/mock/documents"
import type { MockDocumentDetail } from "@/data/mock/documents"
import { DocumentDetail } from "@/features/documents/components/document-detail"
import { resolveMockDocumentByRouteId } from "@/features/documents/lib/demo-document-ids"
import { getDocumentDetailById } from "@/features/documents/lib/supabase-documents"

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>
}

async function resolveDocument(id: string): Promise<MockDocumentDetail | null> {
  try {
    const supabaseDocument = await getDocumentDetailById(id)

    if (supabaseDocument) {
      return supabaseDocument
    }
  } catch (error) {
    console.error(`Failed to load document ${id} from Supabase:`, error)
  }

  return (
    resolveMockDocumentByRouteId(id) ?? mockDocuments.find((document) => document.id === id) ?? null
  )
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params
  const document = await resolveDocument(id)

  if (!document) {
    notFound()
  }

  return <DocumentDetail document={document} />
}
