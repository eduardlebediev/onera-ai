import { getEmployeeTestKpiStats } from "@/features/employee/tests/lib/employee-test-kpi-stats"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface EmployeeTestsKpiSectionProps {
  tests: EmployeeAssignedTest[]
}

export function EmployeeTestsKpiSection({ tests }: EmployeeTestsKpiSectionProps) {
  const stats = getEmployeeTestKpiStats(tests).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={5} stats={stats} />
}
