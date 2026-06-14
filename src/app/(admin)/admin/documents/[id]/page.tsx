import { notFound } from "next/navigation"

import type { MockDocumentDetail } from "@/data/mock/documents"
import { DocumentDetail } from "@/features/documents/components/document-detail"
import { DocumentProcessingRefresher } from "@/features/documents/components/document-processing-refresher"
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

  return null
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params
  const document = await resolveDocument(id)

  if (!document) {
    notFound()
  }

  return (
    <>
      <DocumentProcessingRefresher enabled={document.status === "processing"} />
      <DocumentDetail document={document} />
    </>
  )
}
