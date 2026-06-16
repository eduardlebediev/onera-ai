"use client"

import type { KpiStat } from "@/features/analytics/types/admin-dashboard"
import { mapDashboardKpiStatsToGridItems } from "@/features/analytics/lib/dashboard-kpi-grid-items"
import type { TranslationKey } from "@/shared/i18n/use-translation"
import { useTranslation } from "@/shared/i18n/use-translation"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface KpiCardsProps {
  stats: KpiStat[]
}

function getDashboardKpiLabelKey(id: string): TranslationKey {
  return `kpi.dashboard.${id}` as TranslationKey
}

export function KpiCards({ stats }: KpiCardsProps) {
  const { t } = useTranslation()
  const gridStats = mapDashboardKpiStatsToGridItems(stats).map((item) => ({
    ...item,
    label: t(getDashboardKpiLabelKey(item.id)),
  }))

  return <KpiStatGrid columns={6} stats={gridStats} />
}
