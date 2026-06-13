import { CheckCircle2, Clock, ExternalLink, FileText, XCircle } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import type { DocumentStatus } from "@/data/mock/documents"
import { DocumentVersionBadge } from "@/features/documents/components/document-version-badge"
import type { SavedTestSourceDocument } from "@/features/tests/lib/supabase-test-detail"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestSourceDocumentsSectionProps {
  sources: SavedTestSourceDocument[]
}

const DOCUMENT_STATUS_BADGE: Record<
  DocumentStatus,
  { label: string; icon: ReactNode; className: string }
> = {
  ready: {
    label: "Ready",
    icon: <CheckCircle2 className="mr-1 size-3" />,
    className:
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  processing: {
    label: "Processing",
    icon: <Clock className="mr-1 size-3" />,
    className:
      "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="mr-1 size-3" />,
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
  uploaded: {
    label: "Uploaded",
    icon: null,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  archived: {
    label: "Archived",
    icon: <Clock className="mr-1 size-3" />,
    className:
      "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  },
  deleted: {
    label: "Deleted",
    icon: <XCircle className="mr-1 size-3" />,
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
}

function normalizeStatus(status: string): DocumentStatus {
  if (
    status === "ready" ||
    status === "processing" ||
    status === "failed" ||
    status === "uploaded" ||
    status === "archived" ||
    status === "deleted"
  ) {
    return status
  }

  return "uploaded"
}

export function TestSourceDocumentsSection({ sources }: TestSourceDocumentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{sources.length === 1 ? "Source Document" : "Source Documents"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.map((source) => {
          const status = normalizeStatus(source.status)
          const statusConfig = DOCUMENT_STATUS_BADGE[status]

          return (
            <div
              key={source.documentId}
              className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">{source.title}</p>
                  {source.versionNumber ? (
                    <DocumentVersionBadge
                      versionNumber={source.versionNumber}
                      isLatest={source.isLatest}
                    />
                  ) : null}
                </div>
                <Badge variant="secondary" className={`mt-2 ${statusConfig.className}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/documents/${source.documentId}`}>
                  Open document
                  <ExternalLink className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
