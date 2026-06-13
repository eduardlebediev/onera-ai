import { CheckCircle2, Clock, ExternalLink, FileText, XCircle } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import type { DocumentStatus } from "@/data/mock/documents"
import type { ResolvedTestSourceDocument } from "@/features/tests/lib/test-source-document"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestSourceDocumentsSectionProps {
  source: ResolvedTestSourceDocument
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

export function TestSourceDocumentsSection({ source }: TestSourceDocumentsSectionProps) {
  const statusConfig = DOCUMENT_STATUS_BADGE[source.status]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <p className="font-medium text-foreground">{source.title}</p>
          </div>
          <Badge variant="secondary" className={`mt-2 ${statusConfig.className}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
        <div>
          <p className="typography-small text-muted-foreground">Topics used</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {source.topicsUsed.map((topic) => (
              <Badge key={topic} variant="secondary" className="font-normal">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="typography-small text-muted-foreground">Chunks used</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{source.chunksUsed}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/documents/${source.documentId}`}>
            Open document
            <ExternalLink className="ml-1 size-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
