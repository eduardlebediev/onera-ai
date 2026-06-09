import Link from "next/link"
import { Sparkles } from "lucide-react"

import type { MockAiDraft } from "@/data/mock/admin-dashboard"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"

const DRAFT_REVIEW_LINKS: Record<string, string> = {
  "draft-1": "/admin/tests/review?documentId=doc-1",
  "draft-2": "/admin/tests/review?documentId=doc-1",
  "draft-3": "/admin/tests/review?documentId=doc-4",
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
          {drafts.map((draft) => (
            <div key={draft.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="typography-small font-medium">{draft.title}</p>
                <p className="mt-0.5 typography-small text-muted-foreground font-medium">
                  {draft.questionCount} AI-generated questions
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild>
                <Link href={DRAFT_REVIEW_LINKS[draft.id] ?? "/admin/tests/review?documentId=doc-1"}>
                  Review
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4 pt-2">
          <Button variant="link" asChild>
            <Link href="/admin/tests/review?documentId=doc-1">View all drafts &gt;</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
