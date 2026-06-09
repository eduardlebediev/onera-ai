import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

import type { PublishTestContext } from "@/features/tests/lib/publish-test-model"
import { TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { SummaryRow } from "@/shared/ui/summary-row"

interface PublishSuccessStateProps {
  context: PublishTestContext
  publishedTestId: string
}

export function PublishSuccessState({ context, publishedTestId }: PublishSuccessStateProps) {
  const { reviewData } = context
  const publishedStyle = TEST_STATUS_STYLE.published

  return (
    <Card>
      <CardContent className="space-y-6 py-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div>
          <h1 className="typography-h2">Test published successfully</h1>
          <p className="mt-2 typography-p text-muted-foreground">
            <span className="font-medium text-foreground">{reviewData.testTitle}</span> is now
            available as a published test in this demo flow.
          </p>
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className={publishedStyle.detailBadgeClass}>
            {publishedStyle.icon}
            {publishedStyle.label}
          </Badge>
        </div>

        <div className="mx-auto max-w-md space-y-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-4 text-left">
          <SummaryRow label="Test title" value={reviewData.testTitle} />
          <SummaryRow label="Source document" value={context.sourceDocumentTitle} />
          <SummaryRow label="Approved questions" value={context.approvedCount} />
          <SummaryRow label="Target role" value={reviewData.targetRole} />
          <SummaryRow label="Passing score" value={`${reviewData.passingScore}%`} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/tests/${publishedTestId}`}>Open Test Detail</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/tests/${publishedTestId}/assign`}>Assign to Employees</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tests">View All Tests</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
