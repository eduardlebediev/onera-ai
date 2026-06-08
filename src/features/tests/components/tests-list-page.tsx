"use client"

import { ClipboardList } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import type { TestStatus } from "@/features/tests/mock/tests"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { TestsKpiSection } from "@/features/tests/components/tests-kpi-section"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type StatusFilter = "all" | TestStatus

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
]

interface TestsListPageProps {
  tests: ResolvedMockTest[]
}

export function TestsListPage({ tests }: TestsListPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const visibleTests = useMemo(() => {
    if (statusFilter === "all") return tests
    return tests.filter((test) => test.status === statusFilter)
  }, [tests, statusFilter])

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="typography-h2">Tests</h2>
          <p className="mt-1 typography-p text-muted-foreground">
            Manage AI-generated knowledge tests for your team.
          </p>
        </div>
        <Button className="shrink-0 rounded-full" disabled title="Coming soon">
          Create Test
        </Button>
      </div>

      <div className="mt-8">
        <TestsKpiSection tests={tests} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            className={
              statusFilter === option.value
                ? "bg-foreground text-background hover:bg-foreground/90"
                : ""
            }
            onClick={() => setStatusFilter(option.value)}
            aria-pressed={statusFilter === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="mt-2">
        <Card className="border-none shadow-none bg-transparent">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="border-b border-border/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-5 text-muted-foreground" />
                <h3 className="typography-h3 font-semibold">All Tests</h3>
                <p className="typography-small text-muted-foreground ml-2">
                  {visibleTests.length} shown
                </p>
              </div>
            </div>
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
                      return (
                        <TableRow
                          key={test.id}
                          className="group hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="py-4">
                            <Link
                              href={`/tests/${test.id}`}
                              className="typography-small font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1"
                            >
                              {test.title}
                            </Link>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${statusStyle.listBadgeClass}`}
                            >
                              <span
                                className={`mr-1 size-1.5 rounded-full ${statusStyle.dotClass}`}
                              />
                              {statusStyle.label}
                            </Badge>
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
                          <TableCell className="py-4 text-right">
                            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                              <Link href={`/tests/${test.id}`}>View details</Link>
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
          </div>
        </Card>
      </div>
    </div>
  )
}
