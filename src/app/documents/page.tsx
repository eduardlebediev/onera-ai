import { Upload } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { mockDocuments } from "@/data/mock/documents"
import { DocumentsKpiSection } from "@/features/documents/components/documents-kpi-section"
import { DocumentsTable } from "@/features/documents/components/documents-table"

export default function DocumentsPage() {
  return (
    <div className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Typography variant="h2">Documents</Typography>
          <Typography variant="muted" className="mt-1">
            Manage source documents used to generate tests.
          </Typography>
        </div>
        <Button className="shrink-0 rounded-full" disabled>
          <Upload className="mr-2 size-4" />
          Upload Document
        </Button>
      </div>

      <div className="mt-8">
        <DocumentsKpiSection documents={mockDocuments} />
      </div>

      <div className="mt-2">
        <DocumentsTable documents={mockDocuments} />
      </div>
    </div>
  )
}
