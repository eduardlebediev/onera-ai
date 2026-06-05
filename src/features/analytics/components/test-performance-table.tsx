import { ClipboardList } from "lucide-react"

import type { MockTest, TestStatus } from "@/data/mock/admin-dashboard"
import {
  getScoreColorClass,
  getTestStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Typography } from "@/shared/ui/typography"

function TestStatusBadge({ status }: { status: TestStatus }) {
  const { label, className } = getTestStatusBadgeConfig(status)

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

interface TestPerformanceTableProps {
  tests: MockTest[]
}

export function TestPerformanceTable({ tests }: TestPerformanceTableProps) {
  return (
    <Card className="col-span-12 h-full lg:col-span-7">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <Typography variant="h3">Test Performance Overview</Typography>
          <div className="ml-auto">
            <Button variant="link" size="sm">
              View all &gt;
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-left">
          <TableHeader>
            <TableRow>
              <TableHead className="py-3">
                <Typography variant="small" as="span" className="font-medium text-muted-foreground">
                  Test
                </Typography>
              </TableHead>
              <TableHead className="py-3">
                <Typography variant="small" as="span" className="font-medium text-muted-foreground">
                  Role
                </Typography>
              </TableHead>
              <TableHead className="py-3">
                <Typography variant="small" as="span" className="font-medium text-muted-foreground">
                  Assigned
                </Typography>
              </TableHead>
              <TableHead className="py-3">
                <Typography variant="small" as="span" className="font-medium text-muted-foreground">
                  Completed
                </Typography>
              </TableHead>
              <TableHead className="py-3">
                <Typography variant="small" as="span" className="font-medium text-muted-foreground">
                  Ø Score
                </Typography>
              </TableHead>
              <TableHead className="py-3">
                <Typography variant="small" as="span" className="font-medium text-muted-foreground">
                  Status
                </Typography>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {tests.map((test) => (
              <TableRow key={test.id}>
                <TableCell>
                  <Typography variant="small" className="font-medium">
                    {test.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="small" className="font-medium text-muted-foreground">
                    {test.role}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="small" className="font-medium text-muted-foreground">
                    {test.assignedCount} assigned
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="small" className="font-medium text-muted-foreground">
                    {test.completedCount} completed
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="p"
                    as="span"
                    className={`font-medium ${getScoreColorClass(test.averageScore)}`}
                  >
                    {test.averageScore}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <TestStatusBadge status={test.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
