"use client"

import type { KpiStat } from "@/features/analytics/types/admin-dashboard"
import { mapAnalyticsOverviewStatsToGridItems } from "@/features/analytics/lib/analytics-overview-kpi-grid-items"
import type { TranslationKey } from "@/shared/i18n/use-translation"
import { useTranslation } from "@/shared/i18n/use-translation"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface AnalyticsKpiCardsProps {
  stats: KpiStat[]
}

function getAnalyticsKpiLabelKey(id: string): TranslationKey {
  return `kpi.analytics.${id}` as TranslationKey
}

export function AnalyticsKpiCards({ stats }: AnalyticsKpiCardsProps) {
  const { t } = useTranslation()
  const gridStats = mapAnalyticsOverviewStatsToGridItems(stats).map((item) => ({
    ...item,
    label: t(getAnalyticsKpiLabelKey(item.id)),
  }))

  return <KpiStatGrid columns={6} stats={gridStats} />
}
