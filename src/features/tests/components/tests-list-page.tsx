"use client"

import { useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ClipboardList, Filter } from "lucide-react"
import Link from "next/link"

import { TestDrawer } from "@/features/tests/components/test-drawer"
import { TestsKpiSection } from "@/features/tests/components/tests-kpi-section"
import { formatTestDate } from "@/features/tests/lib/test-format"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import {
  isSourceBlockingValidity,
  normalizeTestSourceValidity,
  TEST_SOURCE_VALIDITY_STYLE,
} from "@/features/tests/lib/test-source-validity-style"
import { TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import type { TestStatus } from "@/features/tests/mock/tests"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTable } from "@/shared/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header"
import { DataTableShell } from "@/shared/ui/data-table-shell"

type StatusFilter = "all" | TestStatus

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
]

interface TestsListPageProps {
  tests: ResolvedMockTest[]
  loadError?: boolean
}

function TestsEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div>
          <p className="typography-h3 font-semibold">No tests yet</p>
          <p className="mt-2 max-w-md typography-p text-muted-foreground">
            Generate your first test from a ready document.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/admin/documents">Generate Test</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TestsLoadErrorState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="typography-h3 font-semibold">Tests could not be loaded</p>
        <p className="max-w-md typography-p text-muted-foreground">
          Refresh the page or try again later. No demo fallback data is shown.
        </p>
      </CardContent>
    </Card>
  )
}

export function TestsListPage({ tests, loadError = false }: TestsListPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const visibleTests = useMemo(() => {
    if (statusFilter === "all") return tests
    return tests.filter((test) => test.status === statusFilter)
  }, [tests, statusFilter])

  const selectedTest = selectedTestId
    ? (tests.find((test) => test.id === selectedTestId) ?? null)
    : null

  const handleOpenDrawer = useCallback((test: ResolvedMockTest) => {
    setSelectedTestId(test.id)
    setIsDrawerOpen(true)
  }, [])

  const columns = useMemo<ColumnDef<ResolvedMockTest>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        enableSorting: true,
        meta: { width: 240 },
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleOpenDrawer(row.original)
            }}
            className="typography-small line-clamp-1 text-left font-medium text-foreground transition-colors group-hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {row.original.title}
          </button>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        enableSorting: true,
        meta: { width: 220 },
        cell: ({ row }) => <TestStatusCell test={row.original} />,
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
        id: "targetRole",
        accessorKey: "targetRole",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Target Role" />,
        enableSorting: true,
        meta: { width: 180 },
      },
      {
        id: "language",
        accessorKey: "language",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Language" />,
        enableSorting: true,
        meta: { width: 120 },
      },
      {
        id: "questionCount",
        accessorKey: "questionCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Questions" />,
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "passingScore",
        accessorKey: "passingScore",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Passing Score" />,
        enableSorting: true,
        meta: { width: 160 },
        cell: ({ row }) => `${row.original.passingScore}%`,
      },
      {
        id: "sourceDocument",
        accessorFn: (test) => test.sourceDocument.title,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source Document" />,
        enableSorting: true,
        meta: { width: 220 },
        cell: ({ row }) => (
          <p className="typography-small truncate text-muted-foreground">
            {row.original.sourceDocument.title}
          </p>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        enableSorting: true,
        meta: { width: 140 },
        cell: ({ row }) => (
          <p className="typography-small whitespace-nowrap text-muted-foreground">
            {formatTestDate(row.original.createdAt)}
          </p>
        ),
      },
      {
        id: "assignedEmployeesCount",
        accessorKey: "assignedEmployeesCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned" />,
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "attemptsCount",
        accessorKey: "attemptsCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Attempts" />,
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        meta: { width: 150, headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href={`/admin/tests/${row.original.id}`}>View details</Link>
            </Button>
          </div>
        ),
      },
    ],
    [handleOpenDrawer]
  )

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="typography-h2">Tests</h2>
          <p className="mt-1 typography-p text-muted-foreground">
            Manage AI-generated knowledge tests for your team.
          </p>
        </div>
        <Button asChild className="shrink-0 rounded-full">
          <Link href="/admin/documents">New Test</Link>
        </Button>
      </div>

      <div className="mt-8">
        <TestsKpiSection tests={tests} />
      </div>

      <div className="mt-6">
        {loadError ? (
          <TestsLoadErrorState />
        ) : tests.length === 0 ? (
          <TestsEmptyState />
        ) : (
          <DataTableShell
            icon={ClipboardList}
            title="All Tests"
            countLabel={`${visibleTests.length} shown`}
          >
            <DataTable
              columns={columns}
              data={visibleTests}
              searchKey="title"
              searchPlaceholder="Search tests..."
              emptyMessage="No tests match the current filter."
              toolbar={
                <div className="relative shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-8 w-full appearance-none rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="pointer-events-none absolute top-2 left-3 size-4 text-muted-foreground" />
                </div>
              }
              getRowProps={(row) => ({
                onClick: () => handleOpenDrawer(row.original),
                className: "group cursor-pointer hover:bg-muted/30 transition-colors",
              })}
            />
          </DataTableShell>
        )}
      </div>
      <TestDrawer test={selectedTest} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  )
}

function TestStatusCell({ test }: { test: ResolvedMockTest }) {
  const statusStyle = TEST_STATUS_STYLE[test.status]
  const sourceValidity = normalizeTestSourceValidity(test.sourceValidity)
  const sourceValidityStyle = TEST_SOURCE_VALIDITY_STYLE[sourceValidity]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={cn("status-badge", statusStyle.listBadgeClass)}>
        <span className={`mr-1 size-1.5 rounded-full ${statusStyle.dotClass}`} />
        {statusStyle.label}
      </Badge>
      {test.isActive === false ? (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          Inactive
        </Badge>
      ) : null}
      {isSourceBlockingValidity(sourceValidity) ? (
        <Badge variant="outline" className={sourceValidityStyle.badgeClass}>
          {sourceValidityStyle.label}
        </Badge>
      ) : null}
    </div>
  )
}
