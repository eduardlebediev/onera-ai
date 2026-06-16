import Link from "next/link"
import { Clock, Target } from "lucide-react"

import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import type { NextRequiredTest } from "@/features/employee/tests/lib/employee-dashboard-model"
import { formatDifficultyLabel } from "@/features/employee/tests/lib/employee-test-model"
import type { AppLocale } from "@/shared/i18n/locale-config"
import type { createTranslator } from "@/shared/i18n/translate"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeDashboardNextTestProps {
  nextTest: NextRequiredTest | null
  locale: AppLocale
  t: Translate
}

export function EmployeeDashboardNextTest({ nextTest, locale, t }: EmployeeDashboardNextTestProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="typography-h3 font-semibold">
            {t("employee.dashboard.nextRequiredTest")}
          </h2>
          <p className="mt-1 typography-small text-muted-foreground">
            {t("employee.dashboard.nextRequiredTestHint")}
          </p>
        </div>

        {!nextTest ? (
          <p className="typography-small text-muted-foreground">
            {t("employee.dashboard.noPendingTests")}
          </p>
        ) : (
          <div className="space-y-4 rounded-lg border border-border/60 bg-background/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{nextTest.test.title}</h3>
                  <Badge variant="outline">{nextTest.statusLabel}</Badge>
                </div>
                <p className="typography-small text-muted-foreground line-clamp-2">
                  {nextTest.test.description}
                </p>
              </div>

              <Button asChild className="shrink-0">
                <Link href={nextTest.actionHref}>{nextTest.actionLabel}</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="typography-label text-muted-foreground">
                  {t("employee.dashboard.deadline")}
                </p>
                <p className="typography-small text-foreground">
                  {formatEmployeeTestDeadline(locale, nextTest.test.deadline, t)}
                </p>
              </div>
              <div>
                <p className="typography-label text-muted-foreground">
                  {t("employee.dashboard.progress")}
                </p>
                <p className="typography-small text-foreground">{nextTest.test.progressPercent}%</p>
              </div>
              <div>
                <p className="typography-label text-muted-foreground">
                  {t("employee.dashboard.estTime")}
                </p>
                <p className="flex items-center gap-1 typography-small text-foreground">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {formatEstimatedTime(locale, nextTest.test.estimatedMinutes)}
                </p>
              </div>
              <div>
                <p className="typography-label text-muted-foreground">
                  {t("employee.dashboard.difficulty")}
                </p>
                <p className="flex items-center gap-1 typography-small text-foreground">
                  <Target className="size-3.5 text-muted-foreground" />
                  {formatDifficultyLabel(nextTest.test.difficulty, t)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
