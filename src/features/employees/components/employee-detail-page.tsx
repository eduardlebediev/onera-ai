"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Circle, Download, MoreVertical } from "lucide-react"
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import type {
  EmployeeDetail,
  EmployeeDetailAssignedTest,
  EmployeeDetailAttempt,
  EmployeeDetailTopicPerformance,
} from "@/features/employees/lib/supabase-employee-detail"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { formatDate as formatLocaleDate } from "@/shared/i18n/format"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ChartContainer, type ChartConfig } from "@/shared/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type EmployeeDetailPageProps = {
  employee: EmployeeDetail
  showBreadcrumbs?: boolean
}

const TREND_RANGE_OPTIONS = [
  { value: "30", labelKey: "employees.detail.last30Days", days: 30 },
  { value: "90", labelKey: "employees.detail.last90Days", days: 90 },
  { value: "all", labelKey: "employees.detail.allTime", days: null },
] as const

type TrendRange = (typeof TREND_RANGE_OPTIONS)[number]["value"]

type ProgressTrendPoint = {
  date: string
  label: string
  score: number
  attempts: number
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return initials || "E"
}

function formatScore(score: number | null): string {
  return typeof score === "number" ? `${score}%` : "--"
}

function formatEmployeeDate(
  locale: ReturnType<typeof useTranslation>["locale"],
  value: string | null
): string {
  if (!value) return "--"

  return formatLocaleDate(locale, value)
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatDifficulty(difficulty: string): string {
  return difficulty
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizePercentScore(score: number): number {
  const percentScore = score <= 1 ? score * 100 : score

  return Math.min(100, Math.max(0, Math.round(percentScore)))
}

function buildProgressTrendPoints(
  attempts: EmployeeDetailAttempt[],
  range: TrendRange,
  locale: ReturnType<typeof useTranslation>["locale"]
): ProgressTrendPoint[] {
  const rangeOption = TREND_RANGE_OPTIONS.find((option) => option.value === range)
  const cutoff =
    rangeOption?.days === null || rangeOption?.days === undefined
      ? null
      : new Date(Date.now() - rangeOption.days * 24 * 60 * 60 * 1000)
  const scoresByDate = new Map<string, { totalScore: number; attempts: number; date: Date }>()

  for (const attempt of attempts) {
    if (typeof attempt.score !== "number" || !attempt.completedAt) continue

    const completedDate = new Date(attempt.completedAt)
    if (Number.isNaN(completedDate.getTime())) continue
    if (cutoff && completedDate < cutoff) continue

    const dateKey = completedDate.toISOString().slice(0, 10)
    const current = scoresByDate.get(dateKey) ?? {
      totalScore: 0,
      attempts: 0,
      date: completedDate,
    }

    current.totalScore += normalizePercentScore(attempt.score)
    current.attempts += 1
    scoresByDate.set(dateKey, current)
  }

  return Array.from(scoresByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      label: formatLocaleDate(locale, value.date.toISOString(), { month: "short", day: "numeric" }),
      score: Math.round(value.totalScore / value.attempts),
      attempts: value.attempts,
    }))
}

function resultBadge(attempt: EmployeeDetailAttempt, t: ReturnType<typeof useTranslation>["t"]) {
  if (attempt.passed === true) {
    return {
      label: t("employees.detail.passed"),
      className: "border-green-200 bg-green-50 text-green-700",
      dotClassName: "bg-green-500",
    }
  }

  if (attempt.passed === false) {
    return {
      label: t("employees.detail.failed"),
      className: "border-red-200 bg-red-50 text-red-700",
      dotClassName: "bg-red-500",
    }
  }

  if (attempt.status === "in_progress") {
    return {
      label: t("employees.detail.inProgress"),
      className: "border-amber-200 bg-amber-50 text-amber-700",
      dotClassName: "bg-amber-500",
    }
  }

  return {
    label: t("employees.detail.noResult"),
    className: "border-slate-200 bg-slate-50 text-slate-600",
    dotClassName: "bg-slate-400",
  }
}

function EmployeeAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {getInitials(name)}
    </div>
  )
}

function ProgressTrendCard({ attempts }: { attempts: EmployeeDetailAttempt[] }) {
  const { locale, t } = useTranslation()
  const progressTrendChartConfig = useMemo(
    () => ({
      score: {
        label: t("employees.detail.score"),
        color: "var(--color-primary)",
      },
    }),
    [t]
  ) satisfies ChartConfig
  const [range, setRange] = useState<TrendRange>("90")
  const chartData = useMemo(
    () => buildProgressTrendPoints(attempts, range, locale),
    [attempts, locale, range]
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">
          {t("employees.detail.progressTrend")}
        </CardTitle>
        <select
          aria-label={t("employees.detail.progressTrendRange")}
          value={range}
          onChange={(event) => setRange(event.target.value as TrendRange)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs outline-none"
        >
          {TREND_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("employees.detail.noScoreTrend")}
              </p>
              <p className="mt-1 typography-small text-muted-foreground">
                {t("employees.detail.completedAttemptsWithScores")}
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer config={progressTrendChartConfig} className="h-56 w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 12, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                minTickGap={24}
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
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                allowDecimals={false}
                tick={{
                  fill: "var(--color-muted-foreground)",
                  fontSize: "var(--font-size-label)",
                  fontWeight: 500,
                }}
                tickFormatter={(value) => `${Math.round(Number(value))}%`}
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
                formatter={(value, _name, item) => {
                  const payload = item.payload as ProgressTrendPoint | undefined
                  const suffix =
                    payload?.attempts === 1
                      ? `1 ${t("employees.detail.attempt")}`
                      : `${payload?.attempts ?? 0} ${t("employees.detail.attempts")}`

                  return [`${Math.round(Number(value))}% (${suffix})`, t("employees.detail.score")]
                }}
              />
              <Line
                type={chartData.length > 1 ? "monotone" : "linear"}
                dataKey="score"
                stroke="var(--color-score)"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "var(--color-score)",
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "var(--color-score)",
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function TopicProgressBar({
  topic,
  colorClass,
}: {
  topic: EmployeeDetailTopicPerformance
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-3">
      <p className="w-1/3 truncate text-sm font-medium">{topic.topic}</p>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={cn("h-full rounded-full", colorClass)}
            style={{ width: `${topic.correctPercent}%` }}
          />
        </div>
      </div>
      <p className="w-10 text-right text-sm font-medium text-muted-foreground">
        {topic.correctPercent}%
      </p>
    </div>
  )
}

function AssignedNotStartedCard({ tests }: { tests: EmployeeDetailAssignedTest[] }) {
  const { locale, t } = useTranslation()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t("employees.detail.assignedNotStarted")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("employees.detail.testsWaiting")}</p>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("employees.detail.noPendingTests")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tests.map((test) => (
              <div key={test.assignmentId} className="rounded-xl border bg-card px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/admin/tests/${test.testId}`}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {test.testTitle}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {test.sourceDocumentTitle}
                    </p>
                    {test.deadline ? (
                      <p className="text-xs text-muted-foreground">
                        {t("employees.detail.deadline")}:{" "}
                        {formatEmployeeDate(locale, test.deadline)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">{formatDifficulty(test.difficulty)}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() => toast.success(t("employees.detail.reminderSent"))}
                    >
                      {t("employees.detail.remind")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EmployeeDetailPage({ employee, showBreadcrumbs = true }: EmployeeDetailPageProps) {
  const { locale, t } = useTranslation()
  const completedAttempts = employee.attempts.filter((a) => a.status === "completed")

  return (
    <div className="page-shell-narrow">
      {/* Top Header */}
      <div className="mb-6">
        {showBreadcrumbs ? (
          <Breadcrumbs
            items={[
              { label: t("breadcrumbs.employees"), href: "/admin/employees" },
              { label: employee.profile.name },
            ]}
            className="mb-4"
          />
        ) : null}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="typography-h1">{t("employees.detail.employeeProgress")}</h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("employees.detail.employeeId")}</p>
              <p className="text-sm font-medium text-foreground">
                {employee.profile.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("employees.detail.joinDate")}</p>
              <p className="text-sm font-medium text-foreground">
                {formatEmployeeDate(locale, employee.membership.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="mr-2 size-4" />
                {t("employees.detail.exportReport")}
              </Button>
              <Button variant="outline" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {/* Top Grid: Profile + KPIs */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_2fr]">
          {/* Profile Card */}
          <Card className="bg-white dark:bg-slate-950">
            <CardContent className="flex h-full items-center gap-4 p-6">
              <EmployeeAvatar name={employee.profile.name} />
              <div className="flex flex-col justify-center">
                <h2 className="text-lg font-semibold">{employee.profile.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {employee.membership.jobTitle || formatRole(employee.membership.role)}
                </p>
                <p className="text-sm text-muted-foreground">{employee.membership.department}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Circle className="size-2.5 fill-green-500 text-green-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t("employees.detail.activelyLearning")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("employees.detail.levelIntermediate")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Card className="flex flex-col justify-center p-4">
              <p className="text-xs text-muted-foreground">
                {t("employees.detail.completedTests")}
              </p>
              <p className="mt-1 text-2xl font-semibold">{employee.stats.totalTests}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("common.assigned", { count: employee.stats.totalAssignedTests })}
              </p>
            </Card>
            <Card className="flex flex-col justify-center p-4">
              <p className="text-xs text-muted-foreground">{t("employees.detail.score")}</p>
              <p className="mt-1 text-2xl font-semibold">{employee.stats.averageScore}%</p>
              <p className="mt-2 flex items-center text-xs font-medium text-green-600">
                <ArrowUpRight className="mr-0.5 size-3" />
                12% vs last 30 days
              </p>
            </Card>
            <Card className="flex flex-col justify-center p-4">
              <p className="text-xs text-muted-foreground">
                {t("employees.detail.overallProgress")}
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {employee.stats.totalAssignedTests > 0
                  ? Math.round(
                      (employee.stats.totalTests / employee.stats.totalAssignedTests) * 100
                    )
                  : 0}
                %
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      employee.stats.totalAssignedTests > 0
                        ? (employee.stats.totalTests / employee.stats.totalAssignedTests) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("employees.detail.onTrack")}</p>
            </Card>
          </div>
        </div>

        {/* Middle Grid: Trend + Completed Quizzes */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <ProgressTrendCard attempts={employee.attempts} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">
                {t("employees.detail.completedTests")}
              </CardTitle>
              <Link href="#" className="text-xs font-medium text-primary hover:underline">
                {t("employees.detail.viewAll")}
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="h-8 text-xs font-normal">
                        {t("employees.detail.testTitle")}
                      </TableHead>
                      <TableHead className="h-8 w-[80px] text-xs font-normal">Score</TableHead>
                      <TableHead className="h-8 w-[120px] text-xs font-normal">
                        {t("employees.detail.completedOn")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAttempts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-sm text-muted-foreground"
                        >
                          {t("employees.detail.noCompletedTests")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedAttempts.slice(0, 5).map((attempt) => (
                        <TableRow
                          key={attempt.id}
                          className="border-b border-slate-100 hover:bg-transparent dark:border-slate-800"
                        >
                          <TableCell className="py-2 text-sm font-medium">
                            {attempt.testTitle}
                          </TableCell>
                          <TableCell className="py-2 text-sm">
                            <span
                              className={
                                (attempt.score ?? 0) >= 80 ? "text-green-600" : "text-amber-600"
                              }
                            >
                              {formatScore(attempt.score)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-sm text-muted-foreground">
                            {formatEmployeeDate(locale, attempt.completedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid: Topics + Learning Path */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {t("employees.detail.strongTopics")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("employees.detail.basedOnMastery")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {employee.strongTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("employees.detail.noData")}</p>
                ) : (
                  employee.strongTopics
                    .slice(0, 5)
                    .map((topic) => (
                      <TopicProgressBar key={topic.topic} topic={topic} colorClass="bg-green-500" />
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {t("employees.detail.weakTopics")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("employees.detail.needsImprovement")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {employee.weakTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("employees.detail.noData")}</p>
                ) : (
                  employee.weakTopics
                    .slice(0, 5)
                    .map((topic) => (
                      <TopicProgressBar key={topic.topic} topic={topic} colorClass="bg-primary" />
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          <AssignedNotStartedCard tests={employee.assignedNotStartedTests} />
        </div>

        {/* Bottom-most Grid: {t("employees.detail.attemptHistory")} + {t("employees.detail.topicMastery")} */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {t("employees.detail.attemptHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="h-8 text-xs font-normal">
                        {t("employees.detail.testTitle")}
                      </TableHead>
                      <TableHead className="h-8 w-[120px] text-xs font-normal">
                        {t("employees.detail.attemptedOn")}
                      </TableHead>
                      <TableHead className="h-8 w-[80px] text-xs font-normal">Score</TableHead>
                      <TableHead className="h-8 w-[100px] text-xs font-normal">
                        {t("employees.detail.result")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.attempts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-sm text-muted-foreground"
                        >
                          {t("employees.detail.noAttempts")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      employee.attempts.map((attempt) => {
                        const badge = resultBadge(attempt, t)
                        return (
                          <TableRow
                            key={attempt.id}
                            className="border-b border-slate-100 hover:bg-transparent dark:border-slate-800"
                          >
                            <TableCell className="py-3 text-sm font-medium">
                              <Link
                                href={`/admin/tests/${attempt.testId}`}
                                className="hover:underline"
                              >
                                {attempt.testTitle}
                              </Link>
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground">
                              {formatEmployeeDate(locale, attempt.completedAt ?? attempt.startedAt)}
                            </TableCell>
                            <TableCell className="py-3 text-sm">
                              {formatScore(attempt.score)}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                variant="outline"
                                className={cn("status-badge", badge.className)}
                              >
                                <span
                                  className={cn("mr-1 size-1.5 rounded-full", badge.dotClassName)}
                                />
                                {badge.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-center">
                <Link href="#" className="text-xs font-medium text-primary hover:underline">
                  {t("employees.detail.viewAll")} attempts
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">
                  {t("employees.detail.topicMastery")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("employees.detail.masteryByTopic")}
                </p>
              </div>
              <Link href="#" className="text-xs font-medium text-primary hover:underline">
                {t("employees.detail.viewAll")} topics
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {employee.allTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("employees.detail.noTopicData")}
                  </p>
                ) : (
                  employee.allTopics.map((topic) => (
                    <TopicProgressBar key={topic.topic} topic={topic} colorClass="bg-primary" />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
