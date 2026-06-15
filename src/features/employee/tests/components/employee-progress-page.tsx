import { EmployeeProgressKpiSection } from "@/features/employee/tests/components/employee-progress-kpi-section"
import type {
  EmployeeProgress,
  EmployeeProgressAttempt,
  EmployeeProgressTopic,
} from "@/features/employee/tests/lib/supabase-employee-progress"
import { getPassFailBadgeClass } from "@/features/employee/tests/lib/employee-test-model"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface EmployeeProgressPageProps {
  progress: EmployeeProgress
  loadError?: boolean
}

function formatScore(score: number | null): string {
  return score === null ? "—" : `${score}%`
}

function formatCompletedDate(completedAt: string | null): string {
  if (!completedAt) return "—"

  return new Date(completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function TopicListCard({
  title,
  topics,
  emptyText,
  tone,
}: {
  title: string
  topics: EmployeeProgressTopic[]
  emptyText: string
  tone: "strength" | "weak"
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {topics.length > 0 ? (
          <ul className="space-y-3">
            {topics.map((topic) => (
              <li
                key={topic.topic}
                className="rounded-xl border border-border/50 bg-background/40 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                    <p className="typography-small mt-1 text-muted-foreground">
                      {topic.correctCount} of {topic.totalCount} answers correct
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      tone === "strength"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-orange-200 bg-orange-50 text-orange-700"
                    )}
                  >
                    {topic.correctPercent}% correct
                  </Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      tone === "strength" ? "bg-emerald-500" : "bg-orange-500"
                    )}
                    style={{ width: `${topic.correctPercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="typography-p text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  )
}

function AttemptStatusBadge({ passed }: { passed: boolean | null }) {
  if (passed === null) {
    return <Badge variant="outline">Unknown</Badge>
  }

  return (
    <Badge variant="outline" className={getPassFailBadgeClass(passed)}>
      {passed ? "Passed" : "Failed"}
    </Badge>
  )
}

function AttemptHistoryTable({ attempts }: { attempts: EmployeeProgressAttempt[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attempt History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border/70 text-muted-foreground">
              <tr>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Test
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Score
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Result
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {attempts.map((attempt) => (
                <tr key={attempt.attemptId}>
                  <td className="py-4 pr-4 font-medium text-foreground">{attempt.testTitle}</td>
                  <td className="px-4 py-4 text-muted-foreground">{formatScore(attempt.score)}</td>
                  <td className="px-4 py-4">
                    <AttemptStatusBadge passed={attempt.passed} />
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatCompletedDate(attempt.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmployeeProgressPage({ progress, loadError = false }: EmployeeProgressPageProps) {
  const hasAttempts = progress.attempts.length > 0

  return (
    <div className="page-shell">
      <div>
        <h2 className="typography-h2">Progress</h2>
        <p className="mt-1 typography-p text-muted-foreground">
          Track completed tests, topic strengths, weak topics, and your full attempt history.
        </p>
      </div>

      {loadError ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="typography-h3 font-semibold">Progress could not be loaded</p>
            <p className="max-w-md typography-p text-muted-foreground">
              Refresh the page or try again later.
            </p>
          </CardContent>
        </Card>
      ) : !hasAttempts ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="typography-h3 font-semibold">
              Complete your first test to see progress here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-8">
            <EmployeeProgressKpiSection progress={progress} />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <section className="grid grid-cols-1 gap-2 lg:grid-cols-2" aria-label="Topic progress">
              <TopicListCard
                title="Strengths"
                topics={progress.strengths}
                emptyText="No strengths above 80% yet."
                tone="strength"
              />
              <TopicListCard
                title="Weak Topics"
                topics={progress.weakTopics}
                emptyText="All topics understood"
                tone="weak"
              />
            </section>

            <section aria-label="Attempt history">
              <AttemptHistoryTable attempts={progress.attempts} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}
