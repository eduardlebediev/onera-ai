"use client"

import { Clock, FileText } from "lucide-react"

import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import {
  formatDifficultyLabel,
  formatEmployeeTestStatus,
  getEmployeeTestDisplayStatus,
  getEmployeeTestStatusBadgeClass,
} from "@/features/employee/tests/lib/employee-test-model"
import type { SupabaseEmployeeTakeableTest } from "@/features/employee/tests/lib/test-taking-state"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

export type QuestionNavigatorState = "current" | "answered" | "unanswered"

interface TestProgressPanelProps {
  test: SupabaseEmployeeTakeableTest
  answeredCount: number
  unansweredCount: number
  completionPercent: number
  questionStates: QuestionNavigatorState[]
  onNavigateToQuestion: (index: number) => void
}

function getNavigatorButtonClass(state: QuestionNavigatorState): string {
  switch (state) {
    case "current":
      return "border-primary bg-primary text-primary-foreground"
    case "answered":
      return "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 dark:border-primary/40 dark:bg-primary/15"
    case "unanswered":
      return "border-border bg-background text-muted-foreground hover:bg-muted/30"
  }
}

export function TestProgressPanel({
  test,
  answeredCount,
  unansweredCount,
  completionPercent,
  questionStates,
  onNavigateToQuestion,
}: TestProgressPanelProps) {
  const { t, locale } = useTranslation()
  const displayStatus = getEmployeeTestDisplayStatus(test)

  return (
    <Card className="h-fit border-border/50 bg-card/80">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="typography-label text-muted-foreground">
            {t("employee.takeTest.progress.title")}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 typography-small">
              <span className="text-foreground">
                {t("employee.takeTest.progress.percentComplete", { percent: completionPercent })}
              </span>
              <span className="text-muted-foreground">
                {t("employee.takeTest.progress.answeredSummary", {
                  answered: answeredCount,
                  unanswered: unansweredCount,
                })}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="typography-label text-muted-foreground">{t("common.questions")}</p>
          <div className="flex flex-wrap gap-2">
            {questionStates.map((state, index) => (
              <button
                key={index}
                type="button"
                aria-label={t("employee.takeTest.goToQuestion", { number: index + 1 })}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onNavigateToQuestion(index)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                  getNavigatorButtonClass(state)
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-border/60 pt-4">
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">{t("dataTable.status")}</p>
            <Badge
              variant="outline"
              className={cn("status-badge", getEmployeeTestStatusBadgeClass(displayStatus))}
            >
              {formatEmployeeTestStatus(displayStatus, t)}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">
              {t("employee.takeTest.progress.sourceDocument")}
            </p>
            <p className="flex items-start gap-1.5 typography-small text-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span>{test.sourceDocument}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">{t("dataTable.difficulty")}</p>
              <p className="typography-small text-foreground">
                {formatDifficultyLabel(test.difficulty, t)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">{t("common.questions")}</p>
              <p className="typography-small text-foreground">{test.questionCount}</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
