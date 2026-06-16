"use client"

import { FileText } from "lucide-react"

import {
  DOCUMENT_STATUS_STYLE,
  getDocumentStatusLabel,
} from "@/features/documents/lib/document-status-style"
import type { PublishTestContext } from "@/features/tests/lib/publish-test-model"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { SummaryRow } from "@/shared/ui/summary-row"
import { useTranslation } from "@/shared/i18n/use-translation"
import { cn } from "@/lib/utils"

interface PublishTestSummaryProps {
  context: PublishTestContext
  isReady: boolean
}

export function PublishTestSummary({ context, isReady }: PublishTestSummaryProps) {
  const { t } = useTranslation()
  const { reviewData } = context
  const documentStatus = DOCUMENT_STATUS_STYLE[context.sourceDocumentStatus]

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl leading-snug">{reviewData.testTitle}</CardTitle>
        <Badge
          variant="outline"
          className={cn(
            "font-normal",
            isReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300"
          )}
        >
          {isReady
            ? t("tests.publish.summary.readyToPublish")
            : t("tests.publish.summary.needsReview")}
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
            {getDocumentStatusLabel(context.sourceDocumentStatus, t)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            {t("tests.publish.summary.questionsGenerated", { count: context.totalQuestions })}
          </span>
          <span className="size-1 rounded-full bg-border" />
          <span className="capitalize">{t(`common.difficulty.${reviewData.difficulty}`)}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{reviewData.targetRole}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{reviewData.language}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>
            {t("tests.publish.summary.passingScoreValue", { score: reviewData.passingScore })}
          </span>
        </div>

        <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-4">
          <SummaryRow
            label={t("tests.publish.summary.selectedTopics")}
            value={reviewData.selectedTopics.length}
          />
          <SummaryRow
            label={t("tests.publish.summary.selectedChunks")}
            value={context.selectedChunksCount}
          />
          <SummaryRow
            label={t("tests.publish.summary.approvedQuestions")}
            value={context.approvedCount}
          />
          <SummaryRow
            label={t("tests.publish.summary.rejectedQuestions")}
            value={context.rejectedCount}
          />
          <SummaryRow
            label={t("tests.publish.summary.editedQuestions")}
            value={context.editedCount}
          />
        </div>
      </CardContent>
    </Card>
  )
}
