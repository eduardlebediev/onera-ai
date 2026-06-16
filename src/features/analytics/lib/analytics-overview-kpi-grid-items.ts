import type { LucideIcon } from "lucide-react"
import { Award, BarChart3, CheckCircle2, HelpCircle, TrendingDown, Users } from "lucide-react"

import type { KpiStat } from "@/features/analytics/types/admin-dashboard"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"
import type { KpiStatGridItem } from "@/shared/ui/kpi-stat-grid"

type AnalyticsKpiMeta = {
  icon: LucideIcon
  getTone: (stat: KpiStat) => KpiTone
}

const ANALYTICS_KPI_META_BY_ID: Record<string, AnalyticsKpiMeta> = {
  teamAverageScore: {
    icon: CheckCircle2,
    getTone: (stat) => (stat.value === "—" ? "neutral" : "success"),
  },
  completionRate: { icon: BarChart3, getTone: () => "neutral" },
  completedAttempts: { icon: Award, getTone: () => "success" },
  weakTopics: {
    icon: TrendingDown,
    getTone: (stat) => (Number(stat.value) > 0 ? "warning" : "neutral"),
  },
  difficultQuestions: {
    icon: HelpCircle,
    getTone: (stat) => (Number(stat.value) > 0 ? "warning" : "neutral"),
  },
  failedAttempts: {
    icon: Users,
    getTone: (stat) => (Number(stat.value) > 0 ? "danger" : "neutral"),
  },
}

export function mapAnalyticsOverviewStatsToGridItems(stats: KpiStat[]): KpiStatGridItem[] {
  return stats.map((stat) => {
    const meta = ANALYTICS_KPI_META_BY_ID[stat.id] ?? {
      icon: BarChart3,
      getTone: () => "neutral" as const,
    }

    return {
      id: stat.id,
      label: stat.id,
      value: stat.value,
      icon: meta.icon,
      tone: meta.getTone(stat),
    }
  })
}
