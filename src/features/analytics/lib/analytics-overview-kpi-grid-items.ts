import type { LucideIcon } from "lucide-react"
import { Award, BarChart3, CheckCircle2, HelpCircle, TrendingDown, Users } from "lucide-react"

import type { KpiStat } from "@/features/analytics/types/admin-dashboard"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"
import type { KpiStatGridItem } from "@/shared/ui/kpi-stat-grid"

type AnalyticsKpiMeta = {
  icon: LucideIcon
  getTone: (stat: KpiStat) => KpiTone
}

const ANALYTICS_KPI_META_BY_LABEL: Record<string, AnalyticsKpiMeta> = {
  "Team Average Score": {
    icon: CheckCircle2,
    getTone: (stat) => (stat.value === "—" ? "neutral" : "success"),
  },
  "Completion Rate": { icon: BarChart3, getTone: () => "neutral" },
  "Completed Attempts": { icon: Award, getTone: () => "success" },
  "Weak Topics": {
    icon: TrendingDown,
    getTone: (stat) => (Number(stat.value) > 0 ? "warning" : "neutral"),
  },
  "Difficult Questions": {
    icon: HelpCircle,
    getTone: (stat) => (Number(stat.value) > 0 ? "warning" : "neutral"),
  },
  "Failed Attempts": {
    icon: Users,
    getTone: (stat) => (Number(stat.value) > 0 ? "danger" : "neutral"),
  },
}

export function mapAnalyticsOverviewStatsToGridItems(stats: KpiStat[]): KpiStatGridItem[] {
  return stats.map((stat) => {
    const meta = ANALYTICS_KPI_META_BY_LABEL[stat.label] ?? {
      icon: BarChart3,
      getTone: () => "neutral" as const,
    }

    return {
      id: stat.label,
      label: stat.label,
      value: stat.value,
      icon: meta.icon,
      tone: meta.getTone(stat),
    }
  })
}
