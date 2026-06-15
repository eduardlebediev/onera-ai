import type { LucideIcon } from "lucide-react"
import { AlertTriangle, ListChecks, Sparkles, Target } from "lucide-react"

import type { EmployeeProgress } from "@/features/employee/tests/lib/supabase-employee-progress"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"

export interface EmployeeProgressKpiStat {
  id: "completed" | "avgScore" | "strengths" | "weakTopics"
  label: string
  value: string
  icon: LucideIcon
  tone: KpiTone
}

export function getEmployeeProgressKpiStats(progress: EmployeeProgress): EmployeeProgressKpiStat[] {
  return [
    {
      id: "completed",
      label: "Tests Completed",
      value: String(progress.completedTestsCount),
      icon: ListChecks,
      tone: "neutral",
    },
    {
      id: "avgScore",
      label: "Average Score",
      value: progress.completedTestsCount > 0 ? `${progress.averageScore}%` : "—",
      icon: Target,
      tone: progress.completedTestsCount > 0 ? "success" : "neutral",
    },
    {
      id: "strengths",
      label: "Strengths",
      value: String(progress.strengths.length),
      icon: Sparkles,
      tone: progress.strengths.length > 0 ? "success" : "neutral",
    },
    {
      id: "weakTopics",
      label: "Weak Topics",
      value: String(progress.weakTopics.length),
      icon: AlertTriangle,
      tone: progress.weakTopics.length > 0 ? "warning" : "neutral",
    },
  ]
}
