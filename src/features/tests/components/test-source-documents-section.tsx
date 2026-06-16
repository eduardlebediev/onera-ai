import { CheckCircle2, Clock, ExternalLink, FileText, XCircle } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import type { DocumentStatus } from "@/features/documents/types/document"
import { getDocumentStatusLabel } from "@/features/documents/lib/document-status-style"
import { DocumentVersionBadge } from "@/features/documents/components/document-version-badge"
import type { SavedTestSourceDocument } from "@/features/tests/lib/supabase-test-detail"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestSourceDocumentsSectionProps {
  sources: SavedTestSourceDocument[]
}

const DOCUMENT_STATUS_BADGE: Record<DocumentStatus, { icon: ReactNode; className: string }> = {
  ready: {
    icon: <CheckCircle2 className="mr-1 size-3" />,
    className:
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  processing: {
    icon: <Clock className="mr-1 size-3" />,
    className:
      "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  failed: {
    icon: <XCircle className="mr-1 size-3" />,
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
  uploaded: {
    icon: null,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  archived: {
    icon: <Clock className="mr-1 size-3" />,
    className:
      "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  },
  deleted: {
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
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {sources.length === 1 ? t("dataTable.sourceDocument") : t("tests.detail.sourceDocuments")}
        </CardTitle>
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
                  {getDocumentStatusLabel(status, t)}
                </Badge>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/documents/${source.documentId}`}>
                  {t("tests.detail.openDocument")}
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
