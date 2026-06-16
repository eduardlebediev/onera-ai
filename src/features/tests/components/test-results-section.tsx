import type { TestResultsSummary } from "@/features/tests/types/test"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestResultsSectionProps {
  results: TestResultsSummary
  id?: string
}

export function TestResultsSection({ results, id }: TestResultsSectionProps) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>Results Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="typography-small text-muted-foreground">Average Score</p>
            <p className="text-2xl font-semibold text-foreground">{results.averageScore}%</p>
          </div>
          <div>
            <p className="typography-small text-muted-foreground">Pass Rate</p>
            <p className="text-2xl font-semibold text-foreground">{results.passRate}%</p>
          </div>
        </div>

        <div>
          <p className="typography-small font-medium text-foreground mb-2">Weak Topics</p>
          {results.weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weak topics yet.</p>
          ) : (
            <ul className="space-y-2">
              {results.weakTopics.map((topic) => (
                <li key={topic.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{topic.topic}</span>
                    <span className="text-muted-foreground">{topic.correctnessPct}% correct</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${topic.correctnessPct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="typography-small font-medium text-foreground mb-2">Recent Attempts</p>
          {results.recentAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <ul className="space-y-2">
              {results.recentAttempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{attempt.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTestDate(attempt.completedAt)}
                    </p>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
