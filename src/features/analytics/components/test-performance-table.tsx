"use client"

import Link from "next/link"
import { ClipboardList } from "lucide-react"

import type { DashboardTest, DashboardTestStatus } from "@/features/analytics/types/admin-dashboard"
import {
  getScoreColorClass,
  getDashboardTestStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function DashboardTestStatusBadge({ status }: { status: DashboardTestStatus }) {
  const { t } = useTranslation()
  const { label, className } = getDashboardTestStatusBadgeConfig(status, t)

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
  const { t } = useTranslation()

  return (
    <Card className="col-span-12 h-full lg:col-span-7">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-muted-foreground" />
          <h3 className="typography-h3">{t("admin.dashboard.testPerformanceOverview")}</h3>
          <div className="ml-auto">
            <Button variant="link" size="sm" asChild>
              <Link href="/admin/tests">{t("common.viewAll")}</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {tests.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-6 py-8">
            <p className="typography-small font-medium text-foreground">
              {t("admin.dashboard.noTestsYet")}
            </p>
            <p className="typography-small text-muted-foreground">
              {t("admin.dashboard.noTestsHint")}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/documents">{t("admin.dashboard.generateTest")}</Link>
            </Button>
          </div>
        ) : (
          <Table className="text-left">
            <TableHeader>
              <TableRow>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.test")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.role")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.assigned")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.completed")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.avgScore")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.status")}
                  </span>
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
                      {t("common.assigned", { count: test.assignedCount })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {t("common.completed", { count: test.completedCount })}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`typography-p font-medium ${test.averageScore > 0 ? getScoreColorClass(test.averageScore) : "text-muted-foreground"}`}
                    >
                      {test.averageScore > 0
                        ? t("common.percent", { value: test.averageScore })
                        : t("common.dash")}
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
