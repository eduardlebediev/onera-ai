"use client"

import { ClipboardList } from "lucide-react"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

import type { TestStatus } from "@/features/tests/mock/tests"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { TestDrawer } from "@/features/tests/components/test-drawer"
import { TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import {
  isSourceBlockingValidity,
  normalizeTestSourceValidity,
  TEST_SOURCE_VALIDITY_STYLE,
} from "@/features/tests/lib/test-source-validity-style"
import { TestsKpiSection } from "@/features/tests/components/tests-kpi-section"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTableShell } from "@/shared/ui/data-table-shell"
import { FilterTabBar } from "@/shared/ui/filter-tab-bar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/lib/utils"

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
        <FilterTabBar
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="mt-2">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Difficulty
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Target Role
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Language
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Questions
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Passing Score
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Source Document
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Created
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Assigned
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Attempts
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleTests.length > 0 ? (
                    visibleTests.map((test) => {
                      const statusStyle = TEST_STATUS_STYLE[test.status]
                      const sourceValidity = normalizeTestSourceValidity(test.sourceValidity)
                      const sourceValidityStyle = TEST_SOURCE_VALIDITY_STYLE[sourceValidity]
                      return (
                        <TableRow
                          key={test.id}
                          onClick={() => handleOpenDrawer(test)}
                          className="group cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="py-4">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleOpenDrawer(test)
                              }}
                              className="typography-small line-clamp-1 text-left font-medium text-foreground transition-colors group-hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              {test.title}
                            </button>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("status-badge", statusStyle.listBadgeClass)}
                              >
                                <span
                                  className={`mr-1 size-1.5 rounded-full ${statusStyle.dotClass}`}
                                />
                                {statusStyle.label}
                              </Badge>
                              {test.isActive === false ? (
                                <Badge
                                  variant="outline"
                                  className="border-amber-200 bg-amber-50 text-amber-700"
                                >
                                  Inactive
                                </Badge>
                              ) : null}
                              {isSourceBlockingValidity(sourceValidity) ? (
                                <Badge variant="outline" className={sourceValidityStyle.badgeClass}>
                                  {sourceValidityStyle.label}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 capitalize">{test.difficulty}</TableCell>
                          <TableCell className="py-4">{test.targetRole}</TableCell>
                          <TableCell className="py-4">{test.language}</TableCell>
                          <TableCell className="py-4">{test.questionCount}</TableCell>
                          <TableCell className="py-4">{test.passingScore}%</TableCell>
                          <TableCell className="py-4 max-w-[180px]">
                            <p className="typography-small text-muted-foreground truncate">
                              {test.sourceDocument.title}
                            </p>
                          </TableCell>
                          <TableCell className="py-4 whitespace-nowrap">
                            <p className="typography-small text-muted-foreground">
                              {formatTestDate(test.createdAt)}
                            </p>
                          </TableCell>
                          <TableCell className="py-4">{test.assignedEmployeesCount}</TableCell>
                          <TableCell className="py-4">{test.attemptsCount}</TableCell>
                          <TableCell
                            className="py-4 text-right"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                              <Link href={`/admin/tests/${test.id}`}>View details</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} className="h-32 text-center">
                        <p className="typography-p text-muted-foreground">
                          No tests match the current filter.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DataTableShell>
        )}
      </div>
      <TestDrawer test={selectedTest} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  )
}
