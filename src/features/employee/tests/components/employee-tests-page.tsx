"use client"

import { useMemo, useState } from "react"

import { EmployeeTestCard } from "@/features/employee/tests/components/employee-test-card"
import { EmployeeTestsKpiSection } from "@/features/employee/tests/components/employee-tests-kpi-section"
import { getEmployeeOverallProgress } from "@/features/employee/tests/lib/employee-test-kpi-stats"
import {
  EMPLOYEE_TEST_FILTER_OPTIONS,
  filterEmployeeTests,
  type EmployeeTestFilter,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import type { MockEmployee } from "@/features/tests/mock/employees"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeTestsPageProps {
  employee: MockEmployee
  tests: EmployeeAssignedTest[]
}

export function EmployeeTestsPage({ employee, tests }: EmployeeTestsPageProps) {
  const [filter, setFilter] = useState<EmployeeTestFilter>("all")
  const overallProgress = getEmployeeOverallProgress(tests)

  const visibleTests = useMemo(() => filterEmployeeTests(tests, filter), [tests, filter])

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="typography-h1">My Tests</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            View assigned knowledge tests, track deadlines, and continue where you left off.
          </p>
        </div>

        <Card className="w-full max-w-md border-border/50 bg-card/80">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{employee.name}</p>
                <p className="typography-small text-muted-foreground">{employee.role}</p>
              </div>
              <Badge variant="outline">{employee.department}</Badge>
            </div>
            <p className="typography-small text-muted-foreground">{overallProgress.label}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <EmployeeTestsKpiSection tests={tests} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {EMPLOYEE_TEST_FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            className={
              filter === option.value ? "bg-foreground text-background hover:bg-foreground/90" : ""
            }
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="mt-2 space-y-2">
        {visibleTests.length > 0 ? (
          visibleTests.map((test) => <EmployeeTestCard key={test.id} test={test} />)
        ) : (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="typography-p text-muted-foreground">
                No tests match the current filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
