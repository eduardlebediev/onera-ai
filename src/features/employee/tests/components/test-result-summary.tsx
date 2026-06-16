"use client"

import { CheckCircle2, FileText, XCircle } from "lucide-react"

import { formatEmployeeTestDeadline } from "@/features/employee/tests/lib/employee-test-format"
import { getPassFailBadgeClass } from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import { formatTestResultTimeSpent } from "@/features/employee/tests/lib/test-result-model"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface TestResultSummaryProps {
  result: EmployeeTestResult
}

export function TestResultSummary({ result }: TestResultSummaryProps) {
  const { t, locale } = useTranslation()
  const StatusIcon = result.passed ? CheckCircle2 : XCircle

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="typography-h1">{result.title}</h1>
            <div className="flex flex-wrap items-center gap-2 typography-small text-muted-foreground">
              <FileText className="size-3.5 shrink-0" />
              <span>{result.sourceDocument}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t("employee.result.completedOn", {
                  date: formatEmployeeTestDeadline(locale, result.completedDate, t),
                })}
              </span>
            </div>
          </div>
          <Badge variant="outline" className={cn("gap-1.5", getPassFailBadgeClass(result.passed))}>
            <StatusIcon className="size-3" />
            {result.passed ? t("status.employeeTest.passed") : t("status.employeeTest.failed")}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="typography-h3 font-semibold">
            {t("common.scoreSummary", {
              score: result.score,
              passingScore: result.passingScore,
            })}
          </p>
          <p className="typography-p text-muted-foreground">{result.description}</p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 typography-small text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{result.totalQuestions}</span>{" "}
            {t("employee.result.totalQuestions")}
          </span>
          <span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {result.correctCount}
            </span>{" "}
            {t("employee.result.correct")}
          </span>
          <span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {result.wrongCount}
            </span>{" "}
            {t("employee.result.wrong")}
          </span>
          <span>
            <span
              className={cn(
                "font-medium",
                result.weakTopics.length > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
              )}
            >
              {result.weakTopics.length}
            </span>{" "}
            {t("employee.result.weakTopics")}
          </span>
          <span>
            {t("common.timeSpent", {
              time: formatTestResultTimeSpent(locale, result.timeSpentMinutes),
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
