import Link from "next/link"
import { ClipboardList } from "lucide-react"

import type { DashboardTest, DashboardTestStatus } from "@/features/analytics/types/admin-dashboard"
import {
  getScoreColorClass,
  getDashboardTestStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function DashboardTestStatusBadge({ status }: { status: DashboardTestStatus }) {
  const { label, className } = getDashboardTestStatusBadgeConfig(status)

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

interface TestPerformanceTableProps {
  tests: DashboardTest[]
}

export function TestPerformanceTable({ tests }: TestPerformanceTableProps) {
  return (
    <Card className="col-span-12 h-full lg:col-span-7">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <h3 className="typography-h3">Test Performance Overview</h3>
          <div className="ml-auto">
            <Button variant="link" size="sm" asChild>
              <Link href="/admin/tests">View all &gt;</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {tests.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-6 py-8">
            <p className="typography-small font-medium text-foreground">No tests yet</p>
            <p className="typography-small text-muted-foreground">
              Generate your first test from a ready document.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/documents">Generate Test</Link>
            </Button>
          </div>
        ) : (
          <Table className="text-left">
            <TableHeader>
              <TableRow>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">Test</span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">Role</span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    Assigned
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    Completed
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    Ø Score
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">Status</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {tests.map((test) => (
                <TableRow key={test.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="typography-small font-medium hover:text-primary hover:underline"
                    >
                      {test.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {test.role}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {test.assignedCount} assigned
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {test.completedCount} completed
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`typography-p font-medium ${test.averageScore > 0 ? getScoreColorClass(test.averageScore) : "text-muted-foreground"}`}
                    >
                      {test.averageScore > 0 ? `${test.averageScore}%` : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DashboardTestStatusBadge status={test.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
