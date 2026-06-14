import { AdminDashboard } from "@/features/analytics/components/admin-dashboard"
import {
  buildEmptyAdminDashboardMetrics,
  getAdminDashboardFromSupabase,
  type AdminDashboardRecentAttempt,
} from "@/features/analytics/lib/supabase-admin-dashboard"
import { requireAdminUser } from "@/features/auth/lib/require-auth"
import type { MockAiDraft, MockDocument } from "@/data/mock/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireAdminUser()
  const organizationId = user.membership.organizationId

  let dashboardMetrics = buildEmptyAdminDashboardMetrics()
  let dashboardRecentDocuments: MockDocument[] = []
  let dashboardAiDrafts: MockAiDraft[] = []
  let recentAttempts: AdminDashboardRecentAttempt[] = []
  let loadError = false

  try {
    const result = await getAdminDashboardFromSupabase(organizationId)

    if (result.metrics) {
      dashboardMetrics = result.metrics
      recentAttempts = result.metrics.recentAttempts
    }

    dashboardRecentDocuments = result.recentDocuments
    dashboardAiDrafts = result.recentDrafts
  } catch (error) {
    console.error("Failed to load admin dashboard from Supabase:", error)
    loadError = true
  }

  return (
    <div className="page-shell">
      <AdminDashboard
        aiDrafts={dashboardAiDrafts}
        kpiStats={dashboardMetrics.kpiStats}
        loadError={loadError}
        recentDocuments={dashboardRecentDocuments}
        testPerformance={dashboardMetrics.testPerformance}
        weeklyCompletions={dashboardMetrics.weeklyCompletions}
        recentAttempts={recentAttempts}
      />
    </div>
  )
}
