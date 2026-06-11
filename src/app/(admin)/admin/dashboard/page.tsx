import {
  aiDrafts,
  kpiStats,
  recentDocuments,
  testPerformance,
  weeklyCompletions,
} from "@/data/mock/admin-dashboard"
import { AdminDashboard } from "@/features/analytics/components/admin-dashboard"
import {
  getAdminDashboardFromSupabase,
  type AdminDashboardRecentAttempt,
} from "@/features/analytics/lib/supabase-admin-dashboard"
import { BackendFallbackBanner } from "@/features/documents/components/backend-fallback-banner"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let dashboardKpiStats = kpiStats
  let dashboardTestPerformance = testPerformance
  let dashboardWeeklyCompletions = weeklyCompletions
  let recentAttempts: AdminDashboardRecentAttempt[] = []
  let showFallbackBanner = false

  try {
    const result = await getAdminDashboardFromSupabase()

    if (result) {
      dashboardKpiStats = result.kpiStats
      dashboardTestPerformance = result.testPerformance
      dashboardWeeklyCompletions = result.weeklyCompletions
      recentAttempts = result.recentAttempts
    } else {
      showFallbackBanner = true
    }
  } catch (error) {
    console.error("Failed to load admin dashboard from Supabase:", error)
    showFallbackBanner = true
  }

  return (
    <div className="page-shell">
      {showFallbackBanner ? <BackendFallbackBanner /> : null}

      <AdminDashboard
        aiDrafts={aiDrafts}
        kpiStats={dashboardKpiStats}
        recentDocuments={recentDocuments}
        testPerformance={dashboardTestPerformance}
        weeklyCompletions={dashboardWeeklyCompletions}
        recentAttempts={recentAttempts}
      />
    </div>
  )
}
