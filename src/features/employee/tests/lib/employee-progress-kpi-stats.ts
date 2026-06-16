import type { LucideIcon } from "lucide-react"
import { AlertTriangle, ListChecks, Sparkles, Target } from "lucide-react"

import type { EmployeeProgress } from "@/features/employee/tests/lib/supabase-employee-progress"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"
import type { createTranslator } from "@/shared/i18n/translate"

type Translate = ReturnType<typeof createTranslator>["t"]

export interface EmployeeProgressKpiStat {
  id: "completed" | "avgScore" | "strengths" | "weakTopics"
  label: string
  value: string
  icon: LucideIcon
  tone: KpiTone
}

export function getEmployeeProgressKpiStats(
  progress: EmployeeProgress,
  t: Translate
): EmployeeProgressKpiStat[] {
  return [
    {
      id: "completed",
      label: t("kpi.employeeProgress.testsCompleted"),
      value: String(progress.completedTestsCount),
      icon: ListChecks,
      tone: "neutral",
    },
    {
      id: "avgScore",
      label: t("kpi.employeeProgress.averageScore"),
      value: progress.completedTestsCount > 0 ? `${progress.averageScore}%` : t("common.dash"),
      icon: Target,
      tone: progress.completedTestsCount > 0 ? "success" : "neutral",
    },
    {
      id: "strengths",
      label: t("kpi.employeeProgress.strengths"),
      value: String(progress.strengths.length),
      icon: Sparkles,
      tone: progress.strengths.length > 0 ? "success" : "neutral",
    },
    {
      id: "weakTopics",
      label: t("kpi.employeeProgress.weakTopics"),
      value: String(progress.weakTopics.length),
      icon: AlertTriangle,
      tone: progress.weakTopics.length > 0 ? "warning" : "neutral",
    },
  ]
}
