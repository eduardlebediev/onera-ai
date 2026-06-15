import { AdminDashboard } from "@/features/analytics/components/admin-dashboard"
import {
  buildEmptyAdminDashboardMetrics,
  getAdminDashboardFromSupabase,
  type AdminDashboardRecentAttempt,
} from "@/features/analytics/lib/supabase-admin-dashboard"
import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { getNewTestRoute } from "@/features/tests/lib/new-test-route"
import type { MockDocument } from "@/data/mock/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireAdminUser()
  const organizationId = user.membership.organizationId

  let dashboardMetrics = buildEmptyAdminDashboardMetrics()
  let dashboardRecentDocuments: MockDocument[] = []
  let recentAttempts: AdminDashboardRecentAttempt[] = []
  let loadError = false
  let generateTestHref = "/admin/documents"

  try {
    const result = await getAdminDashboardFromSupabase(organizationId)

    if (result.metrics) {
      dashboardMetrics = result.metrics
      recentAttempts = result.metrics.recentAttempts
    }

    dashboardRecentDocuments = result.recentDocuments
  } catch (error) {
    console.error("Failed to load admin dashboard from Supabase:", error)
    loadError = true
  }

  try {
    generateTestHref = await getNewTestRoute(organizationId)
  } catch (error) {
    console.error("Failed to resolve generate test route:", error)
  }

  const adminName = user.profile.fullName ?? user.email

  return (
    <div className="page-shell">
      <AdminDashboard
        adminName={adminName}
        generateTestHref={generateTestHref}
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
