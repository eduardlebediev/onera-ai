import type {
  KpiStat,
  MockAiDraft,
  MockDocument,
  MockTest,
  WeeklyCompletion,
} from "@/data/mock/admin-dashboard"
import type { AdminDashboardRecentAttempt } from "@/features/analytics/lib/supabase-admin-dashboard"
import { AiDraftsList } from "@/features/analytics/components/ai-drafts-list"
import { DashboardHeader } from "@/features/analytics/components/dashboard-header"
import { KpiCards } from "@/features/analytics/components/kpi-cards"
import { RecentAttemptsCard } from "@/features/analytics/components/recent-attempts-card"
import { TestCompletionsChart } from "@/features/analytics/components/test-completions-chart"
import { TestPerformanceTable } from "@/features/analytics/components/test-performance-table"
import { RecentDocumentsCard } from "@/features/analytics/components/recent-documents-card"

interface AdminDashboardProps {
  aiDrafts: MockAiDraft[]
  kpiStats: KpiStat[]
  recentDocuments: MockDocument[]
  testPerformance: MockTest[]
  weeklyCompletions: WeeklyCompletion[]
  recentAttempts?: AdminDashboardRecentAttempt[]
}

export function AdminDashboard({
  aiDrafts,
  kpiStats,
  recentDocuments,
  testPerformance,
  weeklyCompletions,
  recentAttempts = [],
}: AdminDashboardProps) {
  return (
    <>
      <DashboardHeader />

      <div className="mt-12 grid grid-cols-12 gap-2">
        <KpiCards stats={kpiStats} />

        <RecentDocumentsCard documents={recentDocuments} />
        <AiDraftsList drafts={aiDrafts} />

        <TestPerformanceTable tests={testPerformance} />
        <TestCompletionsChart data={weeklyCompletions} />

        <RecentAttemptsCard attempts={recentAttempts} />
      </div>
    </>
  )
}
