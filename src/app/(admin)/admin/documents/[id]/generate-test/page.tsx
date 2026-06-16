import { notFound } from "next/navigation"

import type { DocumentDetail } from "@/features/documents/types/document"
import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { GenerateTestSetup } from "@/features/documents/components/generate-test-setup"
import {
  canGenerateTest,
  type GenerateTestTargetEmployee,
} from "@/features/documents/components/generate-test-model"
import { getGenerateTestTargetEmployees } from "@/features/documents/lib/generate-test-target-employees"
import {
  getDocumentDetailById,
  getDocumentsFromSupabase,
} from "@/features/documents/lib/supabase-documents"

interface GenerateTestPageProps {
  params: Promise<{ id: string }>
}

function isSelectableDocument(document: DocumentDetail): boolean {
  return (
    document.status === "ready" && document.isLatestVersion !== false && canGenerateTest(document)
  )
}

export default async function GenerateTestPage({ params }: GenerateTestPageProps) {
  const { id } = await params
  const admin = await requireAdminUser()

  let document: DocumentDetail | undefined
  let selectableDocuments: DocumentDetail[] = []
  let targetEmployees: GenerateTestTargetEmployee[] = []

  try {
    document = (await getDocumentDetailById(id)) ?? undefined

    const [documentsResult, employees] = await Promise.all([
      getDocumentsFromSupabase(),
      getGenerateTestTargetEmployees(admin.membership.organizationId),
    ])
    selectableDocuments = documentsResult.documents.filter(isSelectableDocument)
    targetEmployees = employees
  } catch (error) {
    console.error(`Failed to load document ${id} for generate-test:`, error)
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
      targetEmployees={targetEmployees}
    />
  )
}
