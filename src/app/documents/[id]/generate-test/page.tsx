import { notFound } from "next/navigation"

import { mockDocuments } from "@/data/mock/documents"
import { GenerateTestSetup } from "@/features/documents/components/generate-test-setup"

interface GenerateTestPageProps {
  params: Promise<{ id: string }>
}

export default async function GenerateTestPage({ params }: GenerateTestPageProps) {
  const { id } = await params
  const document = mockDocuments.find((currentDocument) => currentDocument.id === id)

  if (!document) {
    notFound()
  }

  return <GenerateTestSetup document={document} />
}
