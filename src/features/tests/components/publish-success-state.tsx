"use client"

import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

import type { PublishTestContext } from "@/features/tests/lib/publish-test-model"
import { getTestStatusLabel, TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { SummaryRow } from "@/shared/ui/summary-row"

interface PublishSuccessStateProps {
  context: PublishTestContext
  publishedTestId: string
}

export function PublishSuccessState({ context, publishedTestId }: PublishSuccessStateProps) {
  const { t } = useTranslation()
  const { reviewData } = context
  const publishedStyle = TEST_STATUS_STYLE.published

  return (
    <Card>
      <CardContent className="space-y-6 py-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div>
          <h1 className="typography-h2">{t("tests.publish.success.title")}</h1>
          <p className="mt-2 typography-p text-muted-foreground">
            {t("tests.publish.success.subtitle", { title: reviewData.testTitle })}
          </p>
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className={publishedStyle.detailBadgeClass}>
            {publishedStyle.icon}
            {getTestStatusLabel("published", t)}
          </Badge>
        </div>

        <div className="mx-auto max-w-md space-y-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-4 text-left">
          <SummaryRow label={t("tests.publish.summary.testTitle")} value={reviewData.testTitle} />
          <SummaryRow
            label={t("tests.publish.summary.sourceDocument")}
            value={context.sourceDocumentTitle}
          />
          <SummaryRow
            label={t("tests.publish.summary.approvedQuestions")}
            value={context.approvedCount}
          />
          <SummaryRow label={t("tests.publish.summary.targetRole")} value={reviewData.targetRole} />
          <SummaryRow
            label={t("tests.publish.summary.passingScore")}
            value={t("common.percent", { value: reviewData.passingScore })}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/admin/tests/${publishedTestId}`}>
              {t("tests.publish.success.openTestDetail")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/tests/${publishedTestId}/assign`}>
              {t("tests.publish.success.assignToEmployees")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/tests">{t("tests.publish.success.viewAllTests")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
