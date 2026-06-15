import type { EmployeeDashboardKpiStat } from "@/features/employee/tests/lib/employee-dashboard-kpi"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface EmployeeDashboardKpiSectionProps {
  stats: EmployeeDashboardKpiStat[]
}

export function EmployeeDashboardKpiSection({ stats }: EmployeeDashboardKpiSectionProps) {
  const gridStats = stats.map((item) => ({
    id: item.status,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={5} stats={gridStats} />
}
