import { getEmployeeProgressKpiStats } from "@/features/employee/tests/lib/employee-progress-kpi-stats"
import type { EmployeeProgress } from "@/features/employee/tests/lib/supabase-employee-progress"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface EmployeeProgressKpiSectionProps {
  progress: EmployeeProgress
}

export function EmployeeProgressKpiSection({ progress }: EmployeeProgressKpiSectionProps) {
  const stats = getEmployeeProgressKpiStats(progress).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={4} stats={stats} />
}
