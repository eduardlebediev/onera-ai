import { AdminAnalyticsPage } from "@/features/analytics/components/admin-analytics-page"
import { getAdminAnalyticsFromSupabase } from "@/features/analytics/lib/supabase-analytics"
import { requireAdminUser } from "@/features/auth/lib/require-auth"

export const dynamic = "force-dynamic"

export default async function AnalyticsRoute() {
  const user = await requireAdminUser()
  const analytics = await getAdminAnalyticsFromSupabase(user.membership.organizationId)

  return (
    <div className="page-shell">
      <AdminAnalyticsPage analytics={analytics} />
    </div>
  )
}
