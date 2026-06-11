import { Upload } from "lucide-react"

import { mockDocuments } from "@/data/mock/documents"
import { BackendFallbackBanner } from "@/features/documents/components/backend-fallback-banner"
import { DocumentsKpiSection } from "@/features/documents/components/documents-kpi-section"
import { DocumentsTable } from "@/features/documents/components/documents-table"
import { getDocumentsFromSupabase } from "@/features/documents/lib/supabase-documents"
import { Button } from "@/shared/ui/button"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  let documents = mockDocuments
  let showFallbackBanner = false

  try {
    const result = await getDocumentsFromSupabase()

    if (result.documents.length > 0) {
      documents = result.documents
    } else {
      showFallbackBanner = true
    }
  } catch (error) {
    console.error("Failed to load documents from Supabase:", error)
    showFallbackBanner = true
  }

  return (
    <div className="page-shell">
      {showFallbackBanner ? <BackendFallbackBanner /> : null}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="typography-h2">Documents</h2>
          <p className="mt-1 typography-p text-muted-foreground">
            Manage source documents used to generate tests.
          </p>
        </div>
        <Button className="shrink-0 rounded-full" disabled>
          <Upload className="mr-2 size-4" />
          Upload Document
        </Button>
      </div>

      <div className="mt-8">
        <DocumentsKpiSection documents={documents} />
      </div>

      <div className="mt-2">
        <DocumentsTable documents={documents} />
      </div>
    </div>
  )
}
