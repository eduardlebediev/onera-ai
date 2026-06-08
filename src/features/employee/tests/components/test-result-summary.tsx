import { CheckCircle2, FileText, XCircle } from "lucide-react"

import { formatEmployeeTestDeadline } from "@/features/employee/tests/lib/employee-test-format"
import { getPassFailBadgeClass } from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface TestResultSummaryProps {
  result: EmployeeTestResult
}

export function TestResultSummary({ result }: TestResultSummaryProps) {
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
              <span>Completed {formatEmployeeTestDeadline(result.completedDate)}</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("gap-1.5", getPassFailBadgeClass(result.passed))}>
            <StatusIcon className="size-3" />
            {result.passed ? "Passed" : "Failed"}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="typography-h2 font-semibold">
            You scored {result.score}%. Passing score: {result.passingScore}%.
          </p>
          <p className="typography-p text-muted-foreground">{result.description}</p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 typography-small text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{result.totalQuestions}</span> total
            questions
          </span>
          <span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {result.correctCount}
            </span>{" "}
            correct
          </span>
          <span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {result.wrongCount}
            </span>{" "}
            wrong
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
