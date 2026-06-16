"use client"

import { getEmployeeKpiStats } from "@/features/employees/lib/employee-kpi-stats"
import type { EmployeeKpiMetrics } from "@/features/employees/lib/supabase-employees"
import type { TranslationKey } from "@/shared/i18n/use-translation"
import { useTranslation } from "@/shared/i18n/use-translation"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface EmployeesKpiSectionProps {
  metrics: EmployeeKpiMetrics
}

function getEmployeeKpiLabelKey(id: string): TranslationKey {
  const keyMap: Record<string, TranslationKey> = {
    total: "kpi.employees.totalEmployees",
    avgScore: "kpi.employees.avgScore",
    pending: "kpi.employees.pending",
    overdue: "kpi.employees.overdue",
  }

  return keyMap[id] ?? "kpi.employees.totalEmployees"
}

export function EmployeesKpiSection({ metrics }: EmployeesKpiSectionProps) {
  const { t } = useTranslation()
  const stats = getEmployeeKpiStats(metrics).map((item) => ({
    id: item.id,
    label: t(getEmployeeKpiLabelKey(item.id)),
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={4} stats={stats} />
}
