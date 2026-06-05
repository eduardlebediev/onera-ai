import { Sparkles } from "lucide-react"

import type { MockAiDraft } from "@/data/mock/admin-dashboard"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Typography } from "@/shared/ui/typography"

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
            <Typography variant="h3">AI Review</Typography>
            <Typography variant="muted" className="mt-1 typography-small font-medium">
              {drafts.length} Test drafts need to be reviewed
            </Typography>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex-1 divide-y divide-border/50 px-6">
          {drafts.map((draft) => (
            <div key={draft.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <Typography variant="p" className="typography-small font-medium">
                  {draft.title}
                </Typography>
                <Typography variant="muted" className="mt-0.5 typography-small font-medium">
                  {draft.questionCount} AI-generated questions
                </Typography>
              </div>
              <Button variant="secondary" size="sm">
                Review
              </Button>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4 pt-2">
          <Button variant="link">View all drafts &gt;</Button>
        </div>
      </CardContent>
    </Card>
  )
}
