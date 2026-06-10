import { notFound } from "next/navigation"

import { resolveMockDocumentByRouteId } from "@/features/documents/lib/demo-document-ids"
import { GenerateTestSetup } from "@/features/documents/components/generate-test-setup"

interface GenerateTestPageProps {
  params: Promise<{ id: string }>
}

export default async function GenerateTestPage({ params }: GenerateTestPageProps) {
  const { id } = await params
  const document = resolveMockDocumentByRouteId(id)

  if (!document) {
    notFound()
  }

  // Render the setup for all documents — the component handles the non-ready blocked state.
  // We intentionally don't redirect so the admin can see why generation is unavailable.
  return <GenerateTestSetup document={document} routeDocumentId={id} />
}
