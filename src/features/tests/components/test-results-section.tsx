"use client"

import type { TestResultsSummary } from "@/features/tests/types/test"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestResultsSectionProps {
  results: TestResultsSummary
  id?: string
}

export function TestResultsSection({ results, id }: TestResultsSectionProps) {
  const { t, locale } = useTranslation()

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>{t("tests.detail.results")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="typography-small text-muted-foreground">{t("kpi.employees.avgScore")}</p>
            <p className="text-2xl font-semibold text-foreground">
              {t("common.percent", { value: results.averageScore })}
            </p>
          </div>
          <div>
            <p className="typography-small text-muted-foreground">{t("common.passRate")}</p>
            <p className="text-2xl font-semibold text-foreground">
              {t("common.percent", { value: results.passRate })}
            </p>
          </div>
        </div>

        <div>
          <p className="typography-small font-medium text-foreground mb-2">
            {t("kpi.dashboard.weakTopics")}
          </p>
          {results.weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tests.detail.noWeakTopics")}</p>
          ) : (
            <ul className="space-y-2">
              {results.weakTopics.map((topic) => (
                <li key={topic.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{topic.topic}</span>
                    <span className="text-muted-foreground">
                      {t("common.correctPercent", { percent: topic.correctnessPct })}
                    </span>
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
          <p className="typography-small font-medium text-foreground mb-2">
            {t("admin.dashboard.recentAttempts")}
          </p>
          {results.recentAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("tests.detail.noAttempts")}</p>
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
                      {formatTestDate(locale, attempt.completedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {t("common.percent", { value: attempt.score })}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        attempt.passed
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                      }
                    >
                      {attempt.passed
                        ? t("status.employeeTest.passed")
                        : t("status.assignment.failed")}
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
