import Link from "next/link"
import { Sparkles } from "lucide-react"

import type { MockAiDraft } from "@/data/mock/admin-dashboard"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"

function getDraftReviewHref(draft: MockAiDraft): string {
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

function getDraftActionLabel(draft: MockAiDraft): string {
  return draft.actionLabel ?? "Review"
}

function getDraftSubtitle(draft: MockAiDraft): string {
  if (draft.status || draft.model || draft.createdAt) {
    const parts = [
      draft.status ? draft.status : null,
      draft.model ? draft.model : null,
      draft.createdAt ? formatTestDate(draft.createdAt) : null,
    ].filter((part): part is string => Boolean(part))

    if (parts.length > 0) {
      return parts.join(" · ")
    }
  }

  return `${draft.questionCount} AI-generated questions`
}

interface AiDraftsListProps {
  drafts: MockAiDraft[]
}

export function AiDraftsList({ drafts }: AiDraftsListProps) {
  return (
    <Card className="col-span-12 h-full lg:col-span-4">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md text-muted-foreground">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h3 className="typography-h3">AI Review</h3>
            <p className="mt-1 typography-small text-muted-foreground font-medium">
              {drafts.length} test drafts need to be reviewed
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex-1 divide-y divide-border/50 px-6">
          {drafts.length === 0 ? (
            <div className="py-6">
              <p className="typography-small font-medium text-foreground">
                No AI drafts waiting for review
              </p>
              <p className="mt-1 typography-small text-muted-foreground">
                Generate a test from a ready document to create a review draft.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="typography-small font-medium">{draft.title}</p>
                  <p className="mt-0.5 typography-small text-muted-foreground font-medium">
                    {getDraftSubtitle(draft)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={getDraftReviewHref(draft)}>{getDraftActionLabel(draft)}</Link>
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="px-6 pb-4 pt-2">
          <Button variant="link" asChild>
            <Link href="/admin/tests">View all tests &gt;</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
