import { notFound } from "next/navigation"

import type { MockDocumentDetail } from "@/data/mock/documents"
import { GenerateTestSetup } from "@/features/documents/components/generate-test-setup"
import { resolveMockDocumentByRouteId } from "@/features/documents/lib/demo-document-ids"
import { getDocumentDetailById } from "@/features/documents/lib/supabase-documents"

interface GenerateTestPageProps {
  params: Promise<{ id: string }>
}

export default async function GenerateTestPage({ params }: GenerateTestPageProps) {
  const { id } = await params

  let document: MockDocumentDetail | undefined

  try {
    document = (await getDocumentDetailById(id)) ?? undefined
  } catch (error) {
    console.error(`Failed to load document ${id} for generate-test:`, error)
  }

  if (!document) {
    document = resolveMockDocumentByRouteId(id)
  }

  if (!document) {
    notFound()
  }

  return <GenerateTestSetup document={document} routeDocumentId={id} />
}
