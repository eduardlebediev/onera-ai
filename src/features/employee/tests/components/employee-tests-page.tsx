"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ClipboardList, Filter } from "lucide-react"
import Link from "next/link"

import { EmployeeTestsKpiSection } from "@/features/employee/tests/components/employee-tests-kpi-section"
import {
  formatEmployeeTestDeadline,
  formatEstimatedTime,
} from "@/features/employee/tests/lib/employee-test-format"
import {
  EMPLOYEE_TEST_FILTER_OPTIONS,
  filterEmployeeTests,
  formatEmployeeTestStatus,
  formatPassFailStatus,
  getEmployeeTestAction,
  getEmployeeTestDisplayStatus,
  getEmployeeTestStatusBadgeClass,
  isEmployeeTestTakeBlocked,
  type EmployeeTestFilter,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTable } from "@/shared/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header"
import { DataTableShell } from "@/shared/ui/data-table-shell"

interface EmployeeTestsPageProps {
  tests: EmployeeAssignedTest[]
}

type EmployeeTestTableRow = EmployeeAssignedTest & {
  displayStatusLabel: string
  deadlineLabel: string
  estimatedTimeLabel: string
  scoreOrProgressLabel: string
  searchText: string
}

function getScoreOrProgressLabel(test: EmployeeAssignedTest): string {
  if (test.score !== null) {
    return `${test.score}%`
  }

  if (test.status === "in_progress") {
    return `${test.progressPercent}% complete`
  }

  return "--"
}

export function EmployeeTestsPage({ tests }: EmployeeTestsPageProps) {
  const [filter, setFilter] = useState<EmployeeTestFilter>("all")

  const visibleTests = useMemo(() => filterEmployeeTests(tests, filter), [tests, filter])
  const tableRows = useMemo<EmployeeTestTableRow[]>(
    () =>
      visibleTests.map((test) => {
        const displayStatus = getEmployeeTestDisplayStatus(test)
        const displayStatusLabel = formatEmployeeTestStatus(displayStatus)
        const deadlineLabel = formatEmployeeTestDeadline(test.deadline)
        const estimatedTimeLabel = formatEstimatedTime(test.estimatedMinutes)
        const scoreOrProgressLabel = getScoreOrProgressLabel(test)

        return {
          ...test,
          displayStatusLabel,
          deadlineLabel,
          estimatedTimeLabel,
          scoreOrProgressLabel,
          searchText: [
            test.title,
            test.description,
            test.sourceDocument,
            test.difficulty,
            displayStatusLabel,
          ].join(" "),
        }
      }),
    [visibleTests]
  )
  const retakeNeededTests = useMemo(
    () => tests.filter((test) => test.status === "failed" && test.canRetake),
    [tests]
  )

  const columns = useMemo<ColumnDef<EmployeeTestTableRow>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Test" />,
        enableSorting: true,
        meta: { width: 300 },
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="typography-small line-clamp-1 font-medium text-foreground">
                {row.original.title}
              </p>
              {row.original.required ? (
                <Badge variant="outline" className="text-[11px]">
                  Required
                </Badge>
              ) : null}
            </div>
            <p className="typography-small line-clamp-2 text-muted-foreground">
              {row.original.description}
            </p>
          </div>
        ),
      },
      {
        id: "displayStatusLabel",
        accessorKey: "displayStatusLabel",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        enableSorting: true,
        meta: { width: 170 },
        cell: ({ row }) => <EmployeeTestStatusCell test={row.original} />,
      },
      {
        id: "sourceDocument",
        accessorKey: "sourceDocument",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
        enableSorting: true,
        meta: { width: 220 },
        cell: ({ row }) => (
          <p className="typography-small truncate text-muted-foreground">
            {row.original.sourceDocument}
          </p>
        ),
      },
      {
        id: "difficulty",
        accessorKey: "difficulty",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Difficulty" />,
        enableSorting: true,
        meta: { width: 140 },
        cell: ({ row }) => <span className="capitalize">{row.original.difficulty}</span>,
      },
      {
        id: "questionCount",
        accessorKey: "questionCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Questions" />,
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "deadlineLabel",
        accessorKey: "deadlineLabel",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deadline" />,
        enableSorting: true,
        meta: { width: 160 },
      },
      {
        id: "estimatedTimeLabel",
        accessorKey: "estimatedTimeLabel",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Est. time" />,
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "scoreOrProgressLabel",
        accessorKey: "scoreOrProgressLabel",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Score / Progress" />,
        enableSorting: true,
        meta: { width: 170 },
        cell: ({ row }) => <EmployeeTestScoreCell test={row.original} />,
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        meta: { width: 150, headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => <EmployeeTestActionCell test={row.original} />,
      },
    ],
    []
  )

  return (
    <div className="page-shell">
      <div>
        <h2 className="typography-h2">My Tests</h2>
        <p className="mt-1 typography-p text-muted-foreground">
          Complete assigned knowledge tests and review your results and feedback.
        </p>
      </div>

      <div className="mt-8">
        <EmployeeTestsKpiSection tests={tests} />
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {retakeNeededTests.length > 0 ? (
          <Card className="border-red-200 bg-red-50/70 dark:border-red-900/30 dark:bg-red-900/20">
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
                    <Button asChild size="sm" className="w-full sm:w-auto">
                      <Link href={`/employee/tests/${test.id}/take`}>Retake Test</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <DataTableShell
          icon={ClipboardList}
          title="Assigned Tests"
          countLabel={`${visibleTests.length} shown`}
        >
          {tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="typography-h3 font-semibold">No assigned tests yet</p>
              <p className="max-w-md typography-p text-muted-foreground">
                When an admin assigns a test to you, it will appear here with a Start Test action.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tableRows}
              searchKey="searchText"
              searchPlaceholder="Search tests..."
              emptyMessage="No tests match the current filter."
              toolbar={
                <div className="relative shrink-0">
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value as EmployeeTestFilter)}
                    className="h-8 w-full appearance-none rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {EMPLOYEE_TEST_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="pointer-events-none absolute top-2 left-3 size-4 text-muted-foreground" />
                </div>
              }
            />
          )}
        </DataTableShell>
      </div>
    </div>
  )
}

function EmployeeTestStatusCell({ test }: { test: EmployeeAssignedTest }) {
  const displayStatus = getEmployeeTestDisplayStatus(test)
  const isBlocked = isEmployeeTestTakeBlocked(test)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className={cn("status-badge", getEmployeeTestStatusBadgeClass(displayStatus))}
      >
        {formatEmployeeTestStatus(displayStatus)}
      </Badge>
      {isBlocked ? (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          Unavailable
        </Badge>
      ) : null}
    </div>
  )
}

function EmployeeTestScoreCell({ test }: { test: EmployeeAssignedTest }) {
  const passFailLabel = formatPassFailStatus(test.score, test.passed)

  if (test.score !== null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span>{test.score}%</span>
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
      </div>
    )
  }

  if (test.status === "in_progress") {
    return <span>{test.progressPercent}% complete</span>
  }

  return <span className="text-muted-foreground">--</span>
}

function EmployeeTestActionCell({ test }: { test: EmployeeAssignedTest }) {
  const action = getEmployeeTestAction(test)

  if (action.disabled || !action.href) {
    return (
      <Button
        variant={action.variant}
        size="sm"
        className="shrink-0"
        disabled
        title={action.disabledReason}
      >
        {action.label}
      </Button>
    )
  }

  return (
    <Button asChild variant={action.variant} size="sm" className="shrink-0">
      <Link href={action.href}>{action.label}</Link>
    </Button>
  )
}
