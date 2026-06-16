import { getTestKpiStats } from "@/features/tests/lib/test-kpi-stats"
import type { TestListItem } from "@/features/tests/types/test"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface TestsKpiSectionProps {
  tests: TestListItem[]
}

export function TestsKpiSection({ tests }: TestsKpiSectionProps) {
  const stats = getTestKpiStats(tests).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={5} stats={stats} />
}
