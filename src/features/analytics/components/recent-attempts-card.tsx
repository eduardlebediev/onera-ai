import type { AdminDashboardRecentAttempt } from "@/features/analytics/lib/supabase-admin-dashboard"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface RecentAttemptsCardProps {
  attempts: AdminDashboardRecentAttempt[]
}

export function RecentAttemptsCard({ attempts }: RecentAttemptsCardProps) {
  if (attempts.length === 0) {
    return null
  }

  return (
    <Card className="col-span-12">
      <CardHeader className="px-6 pb-3 pt-4">
        <CardTitle className="text-base">Recent Attempts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-6 pb-4">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{attempt.employeeName}</p>
              <p className="text-xs text-muted-foreground">{attempt.testTitle}</p>
              <p className="text-xs text-muted-foreground">{formatTestDate(attempt.completedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{attempt.score}%</span>
              <Badge
                variant="outline"
                className={
                  attempt.passed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                }
              >
                {attempt.passed ? "Passed" : "Failed"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
