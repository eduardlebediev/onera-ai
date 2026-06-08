import { Clock, FileText } from "lucide-react"

import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import {
  formatEmployeeTestStatus,
  getEmployeeTestDisplayStatus,
  getEmployeeTestStatusBadgeClass,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeTakeableTest } from "@/features/employee/tests/lib/test-taking-state"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

export type QuestionNavigatorState = "current" | "answered" | "unanswered"

interface TestProgressPanelProps {
  test: EmployeeTakeableTest
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
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
  const displayStatus = getEmployeeTestDisplayStatus(test)

  return (
    <Card className="h-fit border-border/50 bg-card/80">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="typography-label text-muted-foreground">Test progress</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 typography-small">
              <span className="text-foreground">{completionPercent}% complete</span>
              <span className="text-muted-foreground">
                {answeredCount} answered · {unansweredCount} left
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
          <p className="typography-label text-muted-foreground">Questions</p>
          <div className="flex flex-wrap gap-2">
            {questionStates.map((state, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to question ${index + 1}`}
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
            <p className="typography-label text-muted-foreground">Status</p>
            <Badge
              variant="outline"
              className={cn("status-badge", getEmployeeTestStatusBadgeClass(displayStatus))}
            >
              {formatEmployeeTestStatus(displayStatus)}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">Source document</p>
            <p className="flex items-start gap-1.5 typography-small text-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span>{test.sourceDocument}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">Difficulty</p>
              <p className="typography-small capitalize text-foreground">{test.difficulty}</p>
            </div>
            <div className="space-y-1">
              <p className="typography-label text-muted-foreground">Questions</p>
              <p className="typography-small text-foreground">{test.questionCount}</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
