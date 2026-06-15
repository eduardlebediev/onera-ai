import type { LucideIcon } from "lucide-react"
import { CheckCircle2, ClipboardList, Clock, Users } from "lucide-react"

import type { EmployeeKpiMetrics } from "@/features/employees/lib/supabase-employees"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"

export interface EmployeeKpiStat {
  id: "total" | "avgScore" | "pending" | "overdue"
  label: string
  value: string
  icon: LucideIcon
  tone: KpiTone
}

function formatAverageScore(score: number | null): string {
  return typeof score === "number" ? `${score}%` : "--"
}

export function getEmployeeKpiStats(metrics: EmployeeKpiMetrics): EmployeeKpiStat[] {
  return [
    {
      id: "total",
      label: "Total employees",
      value: String(metrics.totalEmployees),
      icon: Users,
      tone: "neutral",
    },
    {
      id: "avgScore",
      label: "Avg score",
      value: formatAverageScore(metrics.averageScore),
      icon: CheckCircle2,
      tone: metrics.averageScore === null ? "neutral" : "success",
    },
    {
      id: "pending",
      label: "Pending",
      value: String(metrics.pendingCount),
      icon: ClipboardList,
      tone: metrics.pendingCount > 0 ? "warning" : "neutral",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: String(metrics.overdueCount),
      icon: Clock,
      tone: metrics.overdueCount > 0 ? "danger" : "neutral",
    },
  ]
}
