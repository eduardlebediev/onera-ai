"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

import type { DashboardAiDraft } from "@/features/analytics/types/admin-dashboard"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"

function getDraftReviewHref(draft: DashboardAiDraft): string {
  if (draft.actionHref) {
    return draft.actionHref
  }

  if (draft.documentId) {
    const params = new URLSearchParams({
      documentId: draft.documentId,
      runId: draft.id,
    })
    return `/admin/tests/review?${params.toString()}`
  }

  return "/admin/tests"
}

function getDraftActionLabel(draft: DashboardAiDraft, t: ReturnType<typeof useTranslation>["t"]) {
  return draft.actionLabel ?? t("admin.dashboard.documentActions.view")
}

function getDraftSubtitle(
  draft: DashboardAiDraft,
  locale: ReturnType<typeof useTranslation>["locale"],
  t: ReturnType<typeof useTranslation>["t"]
): string {
  if (draft.status || draft.model || draft.createdAt) {
    const parts = [
      draft.status ? draft.status : null,
      draft.model ? draft.model : null,
      draft.createdAt ? formatTestDate(locale, draft.createdAt) : null,
    ].filter((part): part is string => Boolean(part))

    if (parts.length > 0) {
      return parts.join(" · ")
    }
  }

  return t("common.questions")
}

interface AiDraftsListProps {
  drafts: DashboardAiDraft[]
}

export function AiDraftsList({ drafts }: AiDraftsListProps) {
  const { t, locale } = useTranslation()

  return (
    <Card className="col-span-12 h-full lg:col-span-4">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md text-muted-foreground">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h3 className="typography-h3">{t("tests.review.title")}</h3>
            <p className="mt-1 typography-small text-muted-foreground font-medium">
              {drafts.length} {t("tests.review.title").toLowerCase()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex-1 divide-y divide-border/50 px-6">
          {drafts.length === 0 ? (
            <div className="py-6">
              <p className="typography-small font-medium text-foreground">
                {t("tests.review.selectQuestion")}
              </p>
              <p className="mt-1 typography-small text-muted-foreground">
                {t("admin.dashboard.noTestsHint")}
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="typography-small font-medium">{draft.title}</p>
                  <p className="mt-0.5 typography-small text-muted-foreground font-medium">
                    {getDraftSubtitle(draft, locale, t)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={getDraftReviewHref(draft)}>{getDraftActionLabel(draft, t)}</Link>
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="px-6 pb-4 pt-2">
          <Button variant="link" asChild>
            <Link href="/admin/tests">{t("common.viewAll")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
