import { FileText } from "lucide-react"

import { DOCUMENT_STATUS_STYLE } from "@/features/documents/lib/document-status-style"
import type { PublishTestContext } from "@/features/tests/lib/publish-test-model"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { SummaryRow } from "@/shared/ui/summary-row"
import { cn } from "@/lib/utils"

interface PublishTestSummaryProps {
  context: PublishTestContext
  isReady: boolean
}

const PUBLISH_STATUS_BADGE = {
  ready: {
    label: "Ready to publish",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  needsReview: {
    label: "Needs review",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300",
  },
} as const

export function PublishTestSummary({ context, isReady }: PublishTestSummaryProps) {
  const { reviewData } = context
  const documentStatus = DOCUMENT_STATUS_STYLE[context.sourceDocumentStatus]
  const publishStatus = isReady ? PUBLISH_STATUS_BADGE.ready : PUBLISH_STATUS_BADGE.needsReview

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl leading-snug">{reviewData.testTitle}</CardTitle>
        <Badge variant="outline" className={cn("font-normal", publishStatus.className)}>
          {publishStatus.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {context.sourceDocumentTitle}
            </span>
          </div>
          <Badge variant="outline" className={cn("font-normal", documentStatus.badgeClass)}>
            <span className={cn("mr-1.5 flex size-1.5 rounded-full", documentStatus.dotClass)} />
            {documentStatus.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{context.totalQuestions} questions generated</span>
          <span className="size-1 rounded-full bg-border" />
          <span className="capitalize">{reviewData.difficulty}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{reviewData.targetRole}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{reviewData.language}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{reviewData.passingScore}% passing score</span>
        </div>

        <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-4">
          <SummaryRow label="Selected topics" value={reviewData.selectedTopics.length} />
          <SummaryRow label="Selected chunks" value={context.selectedChunksCount} />
          <SummaryRow label="Approved questions" value={context.approvedCount} />
          <SummaryRow label="Rejected questions" value={context.rejectedCount} />
          <SummaryRow label="Edited questions" value={context.editedCount} />
        </div>
      </CardContent>
    </Card>
  )
}
