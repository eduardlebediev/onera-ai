"use client"

import Link from "next/link"
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
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { FilterTabBar } from "@/shared/ui/filter-tab-bar"

interface EmployeeTestsPageProps {
  employee: MockEmployee
  tests: EmployeeAssignedTest[]
}

export function EmployeeTestsPage({ employee, tests }: EmployeeTestsPageProps) {
  const [filter, setFilter] = useState<EmployeeTestFilter>("all")
  const overallProgress = getEmployeeOverallProgress(tests)

  const visibleTests = useMemo(() => filterEmployeeTests(tests, filter), [tests, filter])
  const retakeNeededTests = useMemo(
    () => tests.filter((test) => test.status === "failed" && test.canRetake),
    [tests]
  )

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="typography-h1">My Tests</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            Complete assigned knowledge tests and review your results and feedback.
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

      <Breadcrumbs className="mt-6" items={[{ label: "My Tests" }]} />

      <div className="mt-8">
        <EmployeeTestsKpiSection tests={tests} />
      </div>

      {retakeNeededTests.length > 0 ? (
        <Card className="mt-6 border-red-200 bg-red-50/70 dark:border-red-900/30 dark:bg-red-900/20">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="typography-h3 font-semibold text-red-900 dark:text-red-300">
                  Failed / Retake Needed
                </h2>
                <p className="typography-small text-red-800 dark:text-red-400">
                  Retake failed tests before the max-attempt limit is reached.
                </p>
              </div>
              <Badge variant="outline" className="w-fit border-red-200 bg-white text-red-700">
                {retakeNeededTests.length} retakeable
              </Badge>
            </div>

            <div className="space-y-2">
              {retakeNeededTests.map((test) => (
                <div
                  key={test.id}
                  className="flex flex-col gap-3 rounded-xl border border-red-200 bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{test.title}</p>
                    <p className="typography-small text-muted-foreground">
                      Attempt {test.attemptCount ?? 1} of {test.maxAttempts ?? 3} - Latest score{" "}
                      {test.score ?? 0}%
                    </p>
                  </div>
                  <Button asChild size="sm" className="w-full rounded-full sm:w-auto">
                    <Link href={`/employee/tests/${test.id}/take`}>Retake Test</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6">
        <FilterTabBar options={EMPLOYEE_TEST_FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-2 space-y-2">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="typography-h3 font-semibold">No assigned tests yet</p>
              <p className="max-w-md typography-p text-muted-foreground">
                When an admin assigns a test to you, it will appear here with a Start Test action.
              </p>
            </CardContent>
          </Card>
        ) : visibleTests.length > 0 ? (
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
