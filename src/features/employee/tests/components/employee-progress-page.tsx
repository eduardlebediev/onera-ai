import { EmployeeProgressKpiSection } from "@/features/employee/tests/components/employee-progress-kpi-section"
import type {
  EmployeeProgress,
  EmployeeProgressAttempt,
  EmployeeProgressTopic,
} from "@/features/employee/tests/lib/supabase-employee-progress"
import { getPassFailBadgeClass } from "@/features/employee/tests/lib/employee-test-model"
import { formatDate } from "@/shared/i18n/format"
import { getTranslator } from "@/shared/i18n/get-locale"
import type { createTranslator } from "@/shared/i18n/translate"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeProgressPageProps {
  progress: EmployeeProgress
  loadError?: boolean
}

function formatScore(score: number | null, t: Translate): string {
  return score === null ? t("common.dash") : `${score}%`
}

function TopicListCard({
  title,
  topics,
  emptyText,
  tone,
  t,
}: {
  title: string
  topics: EmployeeProgressTopic[]
  emptyText: string
  tone: "strength" | "weak"
  t: Translate
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
                      {t("common.correctOf", {
                        correct: topic.correctCount,
                        total: topic.totalCount,
                      })}
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
                    {t("common.correctPercent", { percent: topic.correctPercent })}
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

function AttemptStatusBadge({ passed, t }: { passed: boolean | null; t: Translate }) {
  if (passed === null) {
    return <Badge variant="outline">{t("status.employeeTest.unknown")}</Badge>
  }

  return (
    <Badge variant="outline" className={getPassFailBadgeClass(passed)}>
      {passed ? t("status.employeeTest.passed") : t("status.employeeTest.failed")}
    </Badge>
  )
}

function AttemptHistoryTable({
  attempts,
  locale,
  t,
}: {
  attempts: EmployeeProgressAttempt[]
  locale: Awaited<ReturnType<typeof getTranslator>>["locale"]
  t: Translate
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("employee.progress.attemptHistory")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border/70 text-muted-foreground">
              <tr>
                <th scope="col" className="py-3 pr-4 font-medium">
                  {t("dataTable.test")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("dataTable.score")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("dataTable.result")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("dataTable.completed")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {attempts.map((attempt) => (
                <tr key={attempt.attemptId}>
                  <td className="py-4 pr-4 font-medium text-foreground">{attempt.testTitle}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatScore(attempt.score, t)}
                  </td>
                  <td className="px-4 py-4">
                    <AttemptStatusBadge passed={attempt.passed} t={t} />
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {attempt.completedAt
                      ? formatDate(locale, attempt.completedAt)
                      : t("common.dash")}
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

export async function EmployeeProgressPage({
  progress,
  loadError = false,
}: EmployeeProgressPageProps) {
  const { t, locale } = await getTranslator()
  const hasAttempts = progress.attempts.length > 0

  return (
    <div className="page-shell">
      <div>
        <h2 className="typography-h2">{t("employee.progress.title")}</h2>
        <p className="mt-1 typography-p text-muted-foreground">{t("employee.progress.subtitle")}</p>
      </div>

      {loadError ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="typography-h3 font-semibold">{t("common.loadError.progress")}</p>
            <p className="max-w-md typography-p text-muted-foreground">{t("common.refreshHint")}</p>
          </CardContent>
        </Card>
      ) : !hasAttempts ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="typography-h3 font-semibold">{t("employee.progress.emptyTitle")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-8">
            <EmployeeProgressKpiSection progress={progress} t={t} />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <section
              className="grid grid-cols-1 gap-2 lg:grid-cols-2"
              aria-label={t("employee.progress.topicProgress")}
            >
              <TopicListCard
                title={t("employee.progress.strengths")}
                topics={progress.strengths}
                emptyText={t("employee.progress.strengthsEmpty")}
                tone="strength"
                t={t}
              />
              <TopicListCard
                title={t("employee.progress.weakTopics")}
                topics={progress.weakTopics}
                emptyText={t("employee.progress.weakTopicsEmpty")}
                tone="weak"
                t={t}
              />
            </section>

            <section aria-label={t("employee.progress.attemptHistory")}>
              <AttemptHistoryTable attempts={progress.attempts} locale={locale} t={t} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}
