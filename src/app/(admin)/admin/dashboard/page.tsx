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
import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { BackendFallbackBanner } from "@/features/documents/components/backend-fallback-banner"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireAdminUser()
  const organizationId = user.membership.organizationId

  let dashboardKpiStats = kpiStats
  let dashboardTestPerformance = testPerformance
  let dashboardWeeklyCompletions = weeklyCompletions
  let dashboardRecentDocuments = recentDocuments
  let dashboardAiDrafts = aiDrafts
  let recentAttempts: AdminDashboardRecentAttempt[] = []
  let showFallbackBanner = false

  try {
    const result = await getAdminDashboardFromSupabase(organizationId)

    if (result.metrics) {
      dashboardKpiStats = result.metrics.kpiStats
      dashboardTestPerformance = result.metrics.testPerformance
      dashboardWeeklyCompletions = result.metrics.weeklyCompletions
      recentAttempts = result.metrics.recentAttempts
    } else {
      showFallbackBanner = true
    }

    if (result.recentDocuments.length > 0) {
      dashboardRecentDocuments = result.recentDocuments
    } else {
      showFallbackBanner = true
    }

    if (result.recentDrafts.length > 0) {
      dashboardAiDrafts = result.recentDrafts
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
        aiDrafts={dashboardAiDrafts}
        kpiStats={dashboardKpiStats}
        recentDocuments={dashboardRecentDocuments}
        testPerformance={dashboardTestPerformance}
        weeklyCompletions={dashboardWeeklyCompletions}
        recentAttempts={recentAttempts}
      />
    </div>
  )
}
