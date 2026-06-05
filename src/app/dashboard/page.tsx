import {
  aiDrafts,
  kpiStats,
  recentDocuments,
  testPerformance,
  weeklyCompletions,
} from "@/data/mock/admin-dashboard"
import { AdminDashboard } from "@/features/analytics/components/admin-dashboard"

export default function DashboardPage() {
  return (
    <AdminDashboard
      aiDrafts={aiDrafts}
      kpiStats={kpiStats}
      recentDocuments={recentDocuments}
      testPerformance={testPerformance}
      weeklyCompletions={weeklyCompletions}
    />
  )
}
