"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"

import type { WeeklyCompletion } from "@/data/mock/admin-dashboard"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { ChartContainer, type ChartConfig } from "@/shared/ui/chart"
import { Typography } from "@/shared/ui/typography"

const completionsChartConfig = {
  completions: {
    label: "Completions",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

interface TestCompletionsChartProps {
  data: WeeklyCompletion[]
}

function useIsClient() {
  return React.useSyncExternalStore(
    React.useCallback(() => () => undefined, []),
    () => true,
    () => false
  )
}

export function TestCompletionsChart({ data }: TestCompletionsChartProps) {
  const isClient = useIsClient()

  return (
    <Card className="col-span-12 h-full lg:col-span-5">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-muted-foreground" />
            <Typography variant="h3">Test Completions</Typography>
          </div>
          <Typography
            variant="small"
            as="span"
            className="flex items-center gap-1 font-medium text-emerald-600"
          >
            <TrendingUp className="size-4" />
            18%
          </Typography>
        </div>
        <Typography variant="muted" className="mt-1 typography-small font-medium">
          Weekly test completion activity
        </Typography>
      </CardHeader>
      <CardContent className="px-6 pb-4 pt-0">
        {isClient ? (
          <ChartContainer config={completionsChartConfig} className="mt-2 h-56 w-full">
            <AreaChart
              accessibilityLayer
              data={data}
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
                dataKey="day"
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
        ) : (
          <div className="mt-2 h-56 w-full" />
        )}
      </CardContent>
    </Card>
  )
}
