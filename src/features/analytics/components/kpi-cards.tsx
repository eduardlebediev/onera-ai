import type { KpiStat } from "@/features/analytics/types/admin-dashboard"
import { mapDashboardKpiStatsToGridItems } from "@/features/analytics/lib/dashboard-kpi-grid-items"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface KpiCardsProps {
  stats: KpiStat[]
}

export function KpiCards({ stats }: KpiCardsProps) {
  return <KpiStatGrid columns={6} stats={mapDashboardKpiStatsToGridItems(stats)} />
}
