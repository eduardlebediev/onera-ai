import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react"

import type { KpiStat } from "@/features/analytics/types/admin-dashboard"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"
import type { KpiStatGridItem } from "@/shared/ui/kpi-stat-grid"

type DashboardKpiMeta = {
  icon: LucideIcon
  getTone: (stat: KpiStat) => KpiTone
}

const DASHBOARD_KPI_META_BY_ID: Record<string, DashboardKpiMeta> = {
  documents: { icon: FileText, getTone: () => "neutral" },
  activeTests: { icon: ClipboardList, getTone: () => "success" },
  assignedTests: { icon: BarChart2, getTone: () => "neutral" },
  activeEmployees: { icon: Users, getTone: () => "neutral" },
  averageScore: {
    icon: CheckCircle2,
    getTone: (stat) => (stat.value === "—" ? "neutral" : "success"),
  },
  weakTopics: {
    icon: AlertTriangle,
    getTone: (stat) => (Number(stat.value) > 0 ? "danger" : "neutral"),
  },
}

export function mapDashboardKpiStatsToGridItems(stats: KpiStat[]): KpiStatGridItem[] {
  return stats.map((stat) => {
    const meta = DASHBOARD_KPI_META_BY_ID[stat.id] ?? {
      icon: FileText,
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
