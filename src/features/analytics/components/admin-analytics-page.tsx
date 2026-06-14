import { Award, BarChart3, CheckCircle2, HelpCircle, TrendingDown, Users } from "lucide-react"

import type {
  AdminAnalyticsData,
  AnalyticsDifficultQuestion,
  AnalyticsEmployeePerformance,
  AnalyticsWeakTopic,
} from "@/features/analytics/lib/supabase-analytics"
import { getScoreColorClass } from "@/features/analytics/lib/dashboard-formatters"
import { TestPerformanceTable } from "@/features/analytics/components/test-performance-table"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { KpiCard } from "@/shared/ui/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const KPI_ICON_BY_LABEL = {
  "Team Average Score": CheckCircle2,
  "Completion Rate": BarChart3,
  "Completed Attempts": Award,
  "Weak Topics": TrendingDown,
  "Difficult Questions": HelpCircle,
  "Failed Attempts": Users,
} as const

type AdminAnalyticsPageProps = {
  analytics: AdminAnalyticsData
}

function EmptyAnalyticsState() {
  return (
    <Card className="mt-12">
      <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <BarChart3 className="mb-4 size-10 text-muted-foreground" />
        <h2 className="typography-h2">Complete some tests to see analytics</h2>
        <p className="mt-2 max-w-xl typography-muted">
          Team-wide analytics appear after employees complete assigned tests.
        </p>
      </CardContent>
    </Card>
  )
}

function WeakTopicsTable({ topics }: { topics: AnalyticsWeakTopic[] }) {
  return (
    <Card className="col-span-12 lg:col-span-6">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-5 text-muted-foreground" />
          <h3 className="typography-h3">Weak Topics</h3>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {topics.length === 0 ? (
          <p className="px-6 py-8 typography-muted">No weak topics yet</p>
        ) : (
          <Table className="text-left">
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Wrong</TableHead>
                <TableHead>Correctness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.topic}>
                  <TableCell className="font-medium">{topic.topic}</TableCell>
                  <TableCell>
                    {topic.wrongAnswers} / {topic.totalAnswers}
                  </TableCell>
                  <TableCell>
                    <span className={getScoreColorClass(topic.correctnessPct)}>
                      {topic.correctnessPct}%
                    </span>
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

function DifficultQuestionsTable({ questions }: { questions: AnalyticsDifficultQuestion[] }) {
  return (
    <Card className="col-span-12 lg:col-span-6">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-muted-foreground" />
          <h3 className="typography-h3">Difficult Questions</h3>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {questions.length === 0 ? (
          <p className="px-6 py-8 typography-muted">No difficult questions yet</p>
        ) : (
          <Table className="text-left">
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Wrong Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <div className="max-w-[320px]">
                      <p className="typography-small font-medium">{question.questionText}</p>
                      <p className="typography-small text-muted-foreground">{question.topic}</p>
                    </div>
                  </TableCell>
                  <TableCell className="typography-small text-muted-foreground">
                    {question.testTitle}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-red-500">{question.wrongRatioPct}%</span>
                    <span className="ml-1 typography-small text-muted-foreground">
                      ({question.wrongAnswers}/{question.totalAnswers})
                    </span>
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

function EmployeeRow({ employee }: { employee: AnalyticsEmployeePerformance }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate typography-small font-medium">{employee.name}</p>
        <p className="truncate typography-small text-muted-foreground">{employee.email}</p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`typography-small font-semibold ${getScoreColorClass(employee.averageScore)}`}
        >
          {employee.averageScore}%
        </p>
        <p className="typography-small text-muted-foreground">
          {employee.completedAttempts} completed
        </p>
      </div>
    </li>
  )
}

function EmployeePerformanceList({
  failedEmployees,
  bestPerformers,
}: {
  failedEmployees: AnalyticsEmployeePerformance[]
  bestPerformers: AnalyticsEmployeePerformance[]
}) {
  return (
    <Card className="col-span-12 lg:col-span-5">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h3 className="typography-h3">Employee Performance</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <section>
          <h4 className="typography-label text-muted-foreground">Employees With Failed Attempts</h4>
          {failedEmployees.length === 0 ? (
            <p className="mt-3 typography-muted">No employees with failed attempts yet</p>
          ) : (
            <ul className="mt-2">
              {failedEmployees.map((employee) => (
                <EmployeeRow key={`failed-${employee.userId}`} employee={employee} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4 className="typography-label text-muted-foreground">Best Performers</h4>
          {bestPerformers.length === 0 ? (
            <p className="mt-3 typography-muted">No completed attempts yet</p>
          ) : (
            <ul className="mt-2">
              {bestPerformers.map((employee) => (
                <EmployeeRow key={`best-${employee.userId}`} employee={employee} />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

export function AdminAnalyticsPage({ analytics }: AdminAnalyticsPageProps) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="typography-h1">Analytics</h1>
          <p className="mt-1 typography-muted">
            Track team performance, weak topics, difficult questions, and employee outcomes.
          </p>
        </div>
      </div>

      <Breadcrumbs
        className="mt-6"
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Analytics" }]}
      />

      {!analytics.hasActivity ? (
        <EmptyAnalyticsState />
      ) : (
        <div className="mt-12 grid grid-cols-12 gap-2">
          {analytics.overviewStats.map((stat) => {
            const Icon =
              KPI_ICON_BY_LABEL[stat.label as keyof typeof KPI_ICON_BY_LABEL] ?? BarChart3

            return (
              <KpiCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                description={stat.description}
                icon={Icon}
                valueColor={stat.label === "Weak Topics" ? "text-red-500" : undefined}
              />
            )
          })}

          <WeakTopicsTable topics={analytics.weakTopics} />
          <DifficultQuestionsTable questions={analytics.difficultQuestions} />
          <EmployeePerformanceList
            failedEmployees={analytics.failedEmployees}
            bestPerformers={analytics.bestPerformers}
          />
          <TestPerformanceTable tests={analytics.testPerformance} />
        </div>
      )}
    </>
  )
}
