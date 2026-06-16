import { DocumentProcessingRefresher } from "@/features/documents/components/document-processing-refresher"
import { DocumentUploadButton } from "@/features/documents/components/document-upload-button"
import { DocumentsKpiSection } from "@/features/documents/components/documents-kpi-section"
import { DocumentsTable } from "@/features/documents/components/documents-table"
import { getDocumentsFromSupabase } from "@/features/documents/lib/supabase-documents"
import { Card, CardContent } from "@/shared/ui/card"

export const dynamic = "force-dynamic"

function DocumentsEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div>
          <p className="typography-h3 font-semibold">No documents yet</p>
          <p className="mt-2 max-w-md typography-p text-muted-foreground">
            Upload your first document to extract topics and generate knowledge tests.
          </p>
        </div>
        <DocumentUploadButton />
      </CardContent>
    </Card>
  )
}

function DocumentsLoadErrorState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="typography-h3 font-semibold">Documents could not be loaded</p>
        <p className="max-w-md typography-p text-muted-foreground">
          Refresh the page or try again later. Only Supabase data is shown.
        </p>
      </CardContent>
    </Card>
  )
}

export default async function DocumentsPage() {
  let documents: Awaited<ReturnType<typeof getDocumentsFromSupabase>>["documents"] = []
  let loadError = false

  try {
    const result = await getDocumentsFromSupabase()
    documents = result.documents
  } catch (error) {
    console.error("Failed to load documents from Supabase:", error)
    loadError = true
  }

  return (
    <div className="page-shell">
      <DocumentProcessingRefresher
        enabled={documents.some((document) => document.status === "processing")}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="typography-h2">Documents</h2>
          <p className="mt-1 typography-p text-muted-foreground">
            Manage source documents used to generate tests.
          </p>
        </div>
        <DocumentUploadButton />
      </div>

      <div className="mt-8">
        <DocumentsKpiSection documents={documents} />
      </div>

      <div className="mt-2">
        {loadError ? (
          <DocumentsLoadErrorState />
        ) : documents.length === 0 ? (
          <DocumentsEmptyState />
        ) : (
          <DocumentsTable documents={documents} />
        )}
      </div>
    </div>
  )
}
