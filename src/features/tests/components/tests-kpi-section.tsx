"use client"

import { getTestKpiStats } from "@/features/tests/lib/test-kpi-stats"
import type { TestListItem } from "@/features/tests/types/test"
import type { TranslationKey } from "@/shared/i18n/use-translation"
import { useTranslation } from "@/shared/i18n/use-translation"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface TestsKpiSectionProps {
  tests: TestListItem[]
}

function getTestKpiLabelKey(id: string): TranslationKey {
  const keyMap: Record<string, TranslationKey> = {
    total: "kpi.tests.totalTests",
    published: "kpi.tests.publishedTests",
    draft: "kpi.tests.draftTests",
    avgPassingScore: "kpi.tests.averagePassingScore",
    attempts: "kpi.tests.totalAttempts",
  }

  return keyMap[id] ?? "kpi.tests.totalTests"
}

export function TestsKpiSection({ tests }: TestsKpiSectionProps) {
  const { t } = useTranslation()
  const stats = getTestKpiStats(tests).map((item) => ({
    id: item.id,
    label: t(getTestKpiLabelKey(item.id)),
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={5} stats={stats} />
}
