import Link from "next/link"
import { Clock, Target } from "lucide-react"

import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import type { NextRequiredTest } from "@/features/employee/tests/lib/employee-dashboard-model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeDashboardNextTestProps {
  nextTest: NextRequiredTest | null
}

export function EmployeeDashboardNextTest({ nextTest }: EmployeeDashboardNextTestProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="typography-h3 font-semibold">Next Required Test</h2>
          <p className="mt-1 typography-small text-muted-foreground">
            Your highest-priority assigned test based on status and deadline.
          </p>
        </div>

        {!nextTest ? (
          <p className="typography-small text-muted-foreground">
            No pending tests right now. Check back when a new assignment arrives.
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

              <Button asChild className="shrink-0 rounded-full">
                <Link href={nextTest.actionHref}>{nextTest.actionLabel}</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="typography-label text-muted-foreground">Deadline</p>
                <p className="typography-small text-foreground">
                  {formatEmployeeTestDeadline(nextTest.test.deadline)}
                </p>
              </div>
              <div>
                <p className="typography-label text-muted-foreground">Progress</p>
                <p className="typography-small text-foreground">{nextTest.test.progressPercent}%</p>
              </div>
              <div>
                <p className="typography-label text-muted-foreground">Est. Time</p>
                <p className="flex items-center gap-1 typography-small text-foreground">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {formatEstimatedTime(nextTest.test.estimatedMinutes)}
                </p>
              </div>
              <div>
                <p className="typography-label text-muted-foreground">Difficulty</p>
                <p className="flex items-center gap-1 typography-small capitalize text-foreground">
                  <Target className="size-3.5 text-muted-foreground" />
                  {nextTest.test.difficulty}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
