import Link from "next/link"
import { BookOpen, Clock, FileText, Target } from "lucide-react"

import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import { getEmployeeTestPriorityIndicators } from "@/features/employee/tests/lib/employee-test-indicators"
import {
  formatEmployeeTestStatus,
  formatPassFailStatus,
  getEmployeeTestAction,
  getEmployeeTestDisplayStatus,
  getEmployeeTestStatusBadgeClass,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface EmployeeTestCardProps {
  test: EmployeeAssignedTest
}

export function EmployeeTestCard({ test }: EmployeeTestCardProps) {
  const displayStatus = getEmployeeTestDisplayStatus(test)
  const action = getEmployeeTestAction(test)
  const indicators = getEmployeeTestPriorityIndicators(test)
  const passFailLabel = formatPassFailStatus(test.score, test.passed)

  return (
    <Card className="transition-colors hover:bg-muted/20">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="typography-h3 font-semibold text-foreground">{test.title}</h3>
              <Badge
                variant="outline"
                className={cn("status-badge", getEmployeeTestStatusBadgeClass(displayStatus))}
              >
                {formatEmployeeTestStatus(displayStatus)}
              </Badge>
            </div>

            <p className="typography-small text-muted-foreground line-clamp-2">
              {test.description}
            </p>

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

          <Button asChild variant={action.variant} size="sm" className="shrink-0 rounded-full">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">Source</p>
            <p className="flex items-start gap-1.5 typography-small text-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{test.sourceDocument}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">Difficulty</p>
            <p className="typography-small capitalize text-foreground">{test.difficulty}</p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">Questions</p>
            <p className="flex items-center gap-1.5 typography-small text-foreground">
              <BookOpen className="size-3.5 text-muted-foreground" />
              {test.questionCount}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">Deadline</p>
            <p className="typography-small text-foreground">
              {formatEmployeeTestDeadline(test.deadline)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">Est. time</p>
            <p className="flex items-center gap-1.5 typography-small text-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              {formatEstimatedTime(test.estimatedMinutes)}
            </p>
          </div>

          {test.score !== null ? (
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">Score</p>
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
              <p className="typography-label text-muted-foreground">Progress</p>
              <p className="typography-small text-foreground">{test.progressPercent}% complete</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
