"use client"

import Link from "next/link"
import { BookOpen, Clock, FileText, Target } from "lucide-react"

import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import { getEmployeeTestPriorityIndicators } from "@/features/employee/tests/lib/employee-test-indicators"
import {
  formatDifficultyLabel,
  formatEmployeeTestStatus,
  formatPassFailStatus,
  getEmployeeTestAction,
  getEmployeeTestDisplayStatus,
  getEmployeeTestStatusBadgeClass,
  isEmployeeTestTakeBlocked,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { cn } from "@/lib/utils"

interface EmployeeTestDetailProps {
  test: EmployeeAssignedTest
  showBreadcrumbs?: boolean
}

export function EmployeeTestDetail({ test, showBreadcrumbs = true }: EmployeeTestDetailProps) {
  const { t, locale } = useTranslation()
  const displayStatus = getEmployeeTestDisplayStatus(test)
  const action = getEmployeeTestAction(test, t)
  const indicators = getEmployeeTestPriorityIndicators(test, t)
  const passFailLabel = formatPassFailStatus(test.score, test.passed, t)
  const isBlocked = isEmployeeTestTakeBlocked(test)

  return (
    <div className="page-shell-narrow">
      {showBreadcrumbs ? (
        <Breadcrumbs
          items={[
            { label: t("breadcrumbs.myTests"), href: "/employee/tests" },
            { label: test.title },
          ]}
        />
      ) : null}

      <div className={cn(showBreadcrumbs ? "mt-6" : undefined, "space-y-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="typography-h1">{test.title}</h1>
              <Badge
                variant="outline"
                className={cn("status-badge", getEmployeeTestStatusBadgeClass(displayStatus))}
              >
                {formatEmployeeTestStatus(displayStatus, t)}
              </Badge>
              {test.required ? (
                <Badge variant="outline" className="text-[11px]">
                  {t("common.required")}
                </Badge>
              ) : null}
              {isBlocked ? (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  {t("status.employeeTest.unavailable")}
                </Badge>
              ) : null}
            </div>

            <p className="typography-p max-w-3xl text-muted-foreground">{test.description}</p>

            {isBlocked ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">{action.disabledReason}</p>
            ) : null}

            {indicators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {indicators.map((indicator) => {
                  const Icon = indicator.icon
                  return (
                    <Badge
                      key={indicator.id}
                      variant="outline"
                      className={`text-[11px] font-medium ${indicator.className}`}
                    >
                      <Icon className="mr-1 size-3" />
                      {indicator.label}
                    </Badge>
                  )
                })}
              </div>
            ) : null}
          </div>

          {action.disabled || !action.href ? (
            <Button
              variant={action.variant}
              size="lg"
              className="shrink-0"
              disabled
              title={action.disabledReason}
            >
              {action.label}
            </Button>
          ) : (
            <Button asChild variant={action.variant} size="lg" className="shrink-0">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("dataTable.source")}</p>
            <p className="flex items-start gap-1.5 typography-small text-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span>{test.sourceDocument}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("dataTable.difficulty")}</p>
            <p className="typography-small text-foreground">
              {formatDifficultyLabel(test.difficulty, t)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("dataTable.language")}</p>
            <p className="typography-small text-foreground">
              {test.language === "German" ? t("common.language.de") : t("common.language.en")}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("common.questions")}</p>
            <p className="flex items-center gap-1.5 typography-small text-foreground">
              <BookOpen className="size-3.5 text-muted-foreground" />
              {test.questionCount}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("dataTable.passingScore")}</p>
            <p className="typography-small text-foreground">
              {t("common.percent", { value: test.passingScore })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">
              {t("employee.dashboard.deadline")}
            </p>
            <p className="typography-small text-foreground">
              {formatEmployeeTestDeadline(locale, test.deadline, t)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("dataTable.estTime")}</p>
            <p className="flex items-center gap-1.5 typography-small text-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              {formatEstimatedTime(locale, test.estimatedMinutes)}
            </p>
          </div>

          {test.score !== null ? (
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">{t("dataTable.score")}</p>
              <p className="flex items-center gap-1.5 typography-small text-foreground">
                <Target className="size-3.5 text-muted-foreground" />
                {test.score}%
                {passFailLabel ? (
                  <Badge
                    variant="outline"
                    className={
                      test.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                    }
                  >
                    {passFailLabel}
                  </Badge>
                ) : null}
              </p>
            </div>
          ) : test.status === "in_progress" ? (
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">
                {t("employee.dashboard.progress")}
              </p>
              <p className="typography-small text-foreground">
                {t("employee.myTests.percentComplete", { percent: test.progressPercent })}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
