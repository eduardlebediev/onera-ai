import Link from "next/link"
import { MessageSquareQuote } from "lucide-react"

import type { RecentFeedbackItem } from "@/features/employee/tests/lib/employee-dashboard-model"
import { getPassFailBadgeClass } from "@/features/employee/tests/lib/employee-test-model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface EmployeeDashboardRecentFeedbackProps {
  recentFeedback: RecentFeedbackItem | null
}

export function EmployeeDashboardRecentFeedback({
  recentFeedback,
}: EmployeeDashboardRecentFeedbackProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="size-4 text-muted-foreground" />
          <h2 className="typography-h3 font-semibold">Recent Feedback</h2>
        </div>

        {!recentFeedback ? (
          <p className="typography-small text-muted-foreground">
            Complete a test to see your latest score and feedback here.
          </p>
        ) : (
          <div className="space-y-4 rounded-lg border border-border/60 bg-background/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{recentFeedback.title}</h3>
                  <Badge
                    variant="outline"
                    className={cn("status-badge", getPassFailBadgeClass(recentFeedback.passed))}
                  >
                    {recentFeedback.statusLabel}
                  </Badge>
                </div>
                <p className="typography-small text-muted-foreground">
                  Score: {recentFeedback.score}%
                </p>
              </div>

              <Button asChild variant="outline" className="shrink-0">
                <Link href={recentFeedback.resultHref}>View Result</Link>
              </Button>
            </div>

            <p className="typography-small text-muted-foreground">
              <span className="font-medium text-foreground">Weak topics: </span>
              {recentFeedback.weakTopicSummary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
