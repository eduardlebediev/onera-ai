import type {
  KpiStat,
  DashboardDocument,
  DashboardTest,
  WeeklyCompletion,
} from "@/features/analytics/types/admin-dashboard"
import type { AdminDashboardRecentAttempt } from "@/features/analytics/lib/supabase-admin-dashboard"
import { DashboardHeader } from "@/features/analytics/components/dashboard-header"
import { KpiCards } from "@/features/analytics/components/kpi-cards"
import { RecentAttemptsCard } from "@/features/analytics/components/recent-attempts-card"
import { TestCompletionPieChart } from "@/features/analytics/components/test-completion-pie-chart"
import { TestCompletionsChart } from "@/features/analytics/components/test-completions-chart"
import { TestPerformanceTable } from "@/features/analytics/components/test-performance-table"
import { RecentDocumentsCard } from "@/features/analytics/components/recent-documents-card"
import { Card, CardContent } from "@/shared/ui/card"

interface AdminDashboardProps {
  adminName: string
  generateTestHref: string
  kpiStats: KpiStat[]
  loadError?: boolean
  recentDocuments: DashboardDocument[]
  testPerformance: DashboardTest[]
  weeklyCompletions: WeeklyCompletion[]
  recentAttempts?: AdminDashboardRecentAttempt[]
}

export function AdminDashboard({
  adminName,
  generateTestHref,
  kpiStats,
  loadError = false,
  recentDocuments,
  testPerformance,
  weeklyCompletions,
  recentAttempts = [],
}: AdminDashboardProps) {
  return (
    <>
      <DashboardHeader adminName={adminName} generateTestHref={generateTestHref} />

      {loadError ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="typography-h3 font-semibold">Dashboard data could not be loaded</p>
            <p className="max-w-md typography-p text-muted-foreground">
              Refresh the page or try again later. Only Supabase data is shown.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!loadError ? (
        <>
          <div className="mt-8">
            <KpiCards stats={kpiStats} />
          </div>

          <div className="mt-2 grid grid-cols-12 gap-2">
            <RecentDocumentsCard documents={recentDocuments} />
            <TestCompletionPieChart recentAttempts={recentAttempts} />

            <TestPerformanceTable tests={testPerformance} />
            <TestCompletionsChart data={weeklyCompletions} />

            <RecentAttemptsCard attempts={recentAttempts} />
          </div>
        </>
      ) : null}
    </>
  )
}
