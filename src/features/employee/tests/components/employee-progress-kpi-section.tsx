import { getEmployeeProgressKpiStats } from "@/features/employee/tests/lib/employee-progress-kpi-stats"
import type { EmployeeProgress } from "@/features/employee/tests/lib/supabase-employee-progress"
import type { createTranslator } from "@/shared/i18n/translate"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeProgressKpiSectionProps {
  progress: EmployeeProgress
  t: Translate
}

export function EmployeeProgressKpiSection({ progress, t }: EmployeeProgressKpiSectionProps) {
  const stats = getEmployeeProgressKpiStats(progress, t).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={4} stats={stats} />
}
