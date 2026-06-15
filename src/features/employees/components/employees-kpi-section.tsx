import { getEmployeeKpiStats } from "@/features/employees/lib/employee-kpi-stats"
import type { EmployeeKpiMetrics } from "@/features/employees/lib/supabase-employees"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface EmployeesKpiSectionProps {
  metrics: EmployeeKpiMetrics
}

export function EmployeesKpiSection({ metrics }: EmployeesKpiSectionProps) {
  const stats = getEmployeeKpiStats(metrics).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={4} stats={stats} />
}
