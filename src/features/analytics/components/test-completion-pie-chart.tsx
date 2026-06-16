"use client"

import { Pie, PieChart, Cell } from "recharts"

import type { AdminDashboardRecentAttempt } from "@/features/analytics/lib/supabase-admin-dashboard"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"

interface TestCompletionPieChartProps {
  recentAttempts?: AdminDashboardRecentAttempt[]
  totalPassed?: number
  totalFailed?: number
  totalTests?: number
}

const COLORS = {
  passed: "#22c55e",
  failed: "#ef4444",
  draft: "#e2e8f0",
}

export function TestCompletionPieChart({
  recentAttempts = [],
  totalPassed: passedProp,
  totalFailed: failedProp,
  totalTests: totalProp,
}: TestCompletionPieChartProps) {
  const { t } = useTranslation()
  const passedCount = passedProp ?? recentAttempts.filter((a) => a.passed).length
  const failedCount = failedProp ?? recentAttempts.filter((a) => !a.passed).length
  const draftCount = totalProp
    ? Math.max(0, totalProp - passedCount - failedCount)
    : Math.max(0, 10 - passedCount - failedCount)
  const total = passedCount + failedCount + draftCount
  const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0

  const data = [
    {
      name: t("status.employeeTest.passed"),
      value: passedCount,
      color: COLORS.passed,
    },
    {
      name: t("status.assignment.failed"),
      value: failedCount,
      color: COLORS.failed,
    },
    {
      name: t("status.test.draft"),
      value: draftCount,
      color: COLORS.draft,
    },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <Card className="col-span-12 h-full lg:col-span-4">
        <CardHeader className="px-6 pb-3 pt-4">
          <div className="space-y-1">
            <h3 className="typography-h3">{t("admin.dashboard.testCompletion")}</h3>
            <p className="typography-small text-muted-foreground font-medium">
              {t("admin.dashboard.noTestDataYet")}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-6">
          <p className="typography-small text-muted-foreground">
            {t("admin.dashboard.noTestDataHint")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-12 h-full lg:col-span-4">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="space-y-1">
          <h3 className="typography-h3">{t("admin.dashboard.testCompletion")}</h3>
          <p className="typography-small text-muted-foreground font-medium">
            {t("common.testCount", { count: total, plural: total !== 1 ? "s" : "" })} ·{" "}
            {t("common.percent", { value: passRate })} {t("common.passRate")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative flex items-center justify-center">
          <PieChart width={160} height={160}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">
              {t("common.percent", { value: passRate })}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("common.passRate")}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-muted-foreground">
                {entry.name}
                <span className="ml-1 text-foreground">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
