import { ClipboardList } from "lucide-react"

import type { MockTest, TestStatus } from "@/data/mock/admin-dashboard"
import {
  getScoreColorClass,
  getTestStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

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

interface QuizPerformanceCardProps {
  tests: MockTest[]
}

export function QuizPerformanceCard({ tests }: QuizPerformanceCardProps) {
  return (
    <Card className="col-span-12 h-full lg:col-span-7">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <CardTitle className="text-xl font-semibold">Test Performance Overview</CardTitle>
          <Button
            variant="link"
            size="sm"
            className="ml-auto h-auto p-0 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            View all &gt;
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-sm font-semibold text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Test</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Assigned</th>
                <th className="px-6 py-3 font-semibold">Completed</th>
                <th className="px-6 py-3 font-semibold">Ø Score</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tests.map((test) => (
                <tr key={test.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3 font-semibold text-foreground">{test.title}</td>
                  <td className="px-6 py-3 font-semibold text-muted-foreground">{test.role}</td>
                  <td className="px-6 py-3 font-semibold text-muted-foreground">
                    {test.assignedCount} assigned
                  </td>
                  <td className="px-6 py-3 font-semibold text-muted-foreground">
                    {test.completedCount} completed
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-base font-bold ${getScoreColorClass(test.averageScore)}`}
                    >
                      {test.averageScore}%
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <TestStatusBadge status={test.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
