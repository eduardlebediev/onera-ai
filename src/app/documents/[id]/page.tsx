import { notFound } from "next/navigation"

import { mockDocuments } from "@/data/mock/documents"
import { DocumentDetail } from "@/features/documents/components/document-detail"

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params
  const document = mockDocuments.find((d) => d.id === id)

  if (!document) {
    notFound()
  }

  return <DocumentDetail document={document} />
}
