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

const DASHBOARD_KPI_META_BY_LABEL: Record<string, DashboardKpiMeta> = {
  Documents: { icon: FileText, getTone: () => "neutral" },
  "Active Tests": { icon: ClipboardList, getTone: () => "success" },
  "Assigned Tests": { icon: BarChart2, getTone: () => "neutral" },
  "Active Employees": { icon: Users, getTone: () => "neutral" },
  "Average Score": {
    icon: CheckCircle2,
    getTone: (stat) => (stat.value === "—" ? "neutral" : "success"),
  },
  "Weak Topics": {
    icon: AlertTriangle,
    getTone: (stat) => (Number(stat.value) > 0 ? "danger" : "neutral"),
  },
}

export function mapDashboardKpiStatsToGridItems(stats: KpiStat[]): KpiStatGridItem[] {
  return stats.map((stat) => {
    const meta = DASHBOARD_KPI_META_BY_LABEL[stat.label] ?? {
      icon: FileText,
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
