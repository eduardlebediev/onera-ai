"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"

import type { WeeklyCompletion } from "@/features/analytics/types/admin-dashboard"
import type { TranslationKey } from "@/shared/i18n/use-translation"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { ChartContainer, type ChartConfig } from "@/shared/ui/chart"

const WEEKDAY_KEY_BY_LABEL: Record<string, TranslationKey> = {
  Sun: "common.weekdays.sun",
  Mon: "common.weekdays.mon",
  Tue: "common.weekdays.tue",
  Wed: "common.weekdays.wed",
  Thu: "common.weekdays.thu",
  Fri: "common.weekdays.fri",
  Sat: "common.weekdays.sat",
}

interface TestCompletionsChartProps {
  data: WeeklyCompletion[]
}

export function TestCompletionsChart({ data }: TestCompletionsChartProps) {
  const { t } = useTranslation()
  const totalCompletions = data.reduce((sum, item) => sum + item.completions, 0)

  const chartData = data.map((item) => ({
    ...item,
    dayLabel: t(WEEKDAY_KEY_BY_LABEL[item.day] ?? "common.weekdays.mon"),
  }))

  const completionsChartConfig = {
    completions: {
      label: t("admin.dashboard.testCompletions"),
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig

  return (
    <Card className="col-span-12 h-full lg:col-span-5">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-muted-foreground" />
            <h3 className="typography-h3">{t("admin.dashboard.testCompletions")}</h3>
          </div>
          <span className="typography-small flex items-center gap-1 font-medium text-emerald-600">
            <TrendingUp className="size-4" />
            {t("common.thisWeek", { count: totalCompletions })}
          </span>
        </div>
        <p className="mt-1 typography-small text-muted-foreground font-medium">
          {t("admin.dashboard.weeklyActivity")}
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-4 pt-0">
        <ChartContainer config={completionsChartConfig} className="mt-2 h-56 w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 8,
              top: 8,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="completionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-completions)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-completions)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: "var(--font-size-label)",
                fontWeight: 500,
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={32}
              allowDecimals={false}
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: "var(--font-size-label)",
                fontWeight: 500,
              }}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                color: "var(--color-foreground)",
                fontSize: "var(--font-size-label)",
              }}
              labelStyle={{
                color: "var(--color-muted-foreground)",
                fontWeight: 500,
              }}
            />
            <Area
              dataKey="completions"
              type="monotone"
              fill="url(#completionsGradient)"
              stroke="var(--color-completions)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-completions)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
