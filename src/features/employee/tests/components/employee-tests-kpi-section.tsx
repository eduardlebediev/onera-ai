import { getEmployeeTestKpiStats } from "@/features/employee/tests/lib/employee-test-kpi-stats"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import type { createTranslator } from "@/shared/i18n/translate"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeTestsKpiSectionProps {
  tests: EmployeeAssignedTest[]
  t: Translate
}

export function EmployeeTestsKpiSection({ tests, t }: EmployeeTestsKpiSectionProps) {
  const stats = getEmployeeTestKpiStats(tests, t).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={5} stats={stats} />
}
