import type { LucideIcon } from "lucide-react"
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, Target } from "lucide-react"

import { isEmployeeTestFinished } from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import { getDaysUntilDeadline } from "@/features/employee/tests/lib/employee-test-format"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"
import type { createTranslator } from "@/shared/i18n/translate"

type Translate = ReturnType<typeof createTranslator>["t"]

export type EmployeeDashboardKpiStatus =
  | "assigned"
  | "dueSoon"
  | "completed"
  | "averageScore"
  | "weakTopics"

export interface EmployeeDashboardKpiStat {
  label: string
  value: string
  icon: LucideIcon
  tone: KpiTone
  status: EmployeeDashboardKpiStatus
}

const DUE_SOON_DAYS = 7

function isEmployeeTestDueSoon(test: EmployeeAssignedTest): boolean {
  if (isEmployeeTestFinished(test)) return false
  const daysUntil = getDaysUntilDeadline(test.deadline)
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= DUE_SOON_DAYS
}

export function getEmployeeDashboardKpiStats(
  tests: EmployeeAssignedTest[],
  weakTopicCount: number,
  t: Translate
): EmployeeDashboardKpiStat[] {
  const assignedCount = tests.length
  const dueSoonCount = tests.filter(isEmployeeTestDueSoon).length
  const completedCount = tests.filter(isEmployeeTestFinished).length

  const scoredTests = tests.filter((test) => test.score !== null)
  const averageScore =
    scoredTests.length === 0
      ? 0
      : Math.round(
          scoredTests.reduce((sum, test) => sum + (test.score ?? 0), 0) / scoredTests.length
        )

  return [
    {
      label: t("kpi.employeeDashboard.assignedTests"),
      value: String(assignedCount),
      icon: ClipboardList,
      tone: "neutral",
      status: "assigned",
    },
    {
      label: t("kpi.employeeDashboard.dueSoon"),
      value: String(dueSoonCount),
      icon: AlertTriangle,
      tone: dueSoonCount > 0 ? "warning" : "neutral",
      status: "dueSoon",
    },
    {
      label: t("kpi.employeeDashboard.completedTests"),
      value: String(completedCount),
      icon: CheckCircle2,
      tone: "success",
      status: "completed",
    },
    {
      label: t("kpi.employeeDashboard.averageScore"),
      value: scoredTests.length > 0 ? `${averageScore}%` : t("common.dash"),
      icon: Target,
      tone: "neutral",
      status: "averageScore",
    },
    {
      label: t("kpi.employeeDashboard.weakTopics"),
      value: String(weakTopicCount),
      icon: BookOpen,
      tone: weakTopicCount > 0 ? "warning" : "neutral",
      status: "weakTopics",
    },
  ]
}
