import type {
  KpiStat,
  MockAiDraft,
  MockDocument,
  MockTest,
  WeeklyCompletion,
} from "@/data/mock/admin-dashboard"
import { AiReviewCard } from "@/features/analytics/components/ai-review-card"
import { DashboardHeader } from "@/features/analytics/components/dashboard-header"
import { KpiSection } from "@/features/analytics/components/kpi-section"
import { QuizCompletionsCard } from "@/features/analytics/components/quiz-completions-card"
import { QuizPerformanceCard } from "@/features/analytics/components/quiz-performance-card"
import { RecentDocumentsCard } from "@/features/analytics/components/recent-documents-card"

interface AdminDashboardProps {
  aiDrafts: MockAiDraft[]
  kpiStats: KpiStat[]
  recentDocuments: MockDocument[]
  testPerformance: MockTest[]
  weeklyCompletions: WeeklyCompletion[]
}

export function AdminDashboard({
  aiDrafts,
  kpiStats,
  recentDocuments,
  testPerformance,
  weeklyCompletions,
}: AdminDashboardProps) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1920px] px-5 py-10 sm:px-8 lg:px-14 xl:px-16">
        <DashboardHeader />

        <div className="mt-12 grid grid-cols-12 gap-2">
          <KpiSection stats={kpiStats} />

          <RecentDocumentsCard documents={recentDocuments} />
          <AiReviewCard drafts={aiDrafts} />

          <QuizPerformanceCard tests={testPerformance} />
          <QuizCompletionsCard data={weeklyCompletions} />
        </div>
      </div>
    </div>
  )
}
