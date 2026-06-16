import type { LucideIcon } from "lucide-react"
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Target } from "lucide-react"

import {
  isEmployeeTestFinished,
  isEmployeeTestOverdue,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import type { createTranslator } from "@/shared/i18n/translate"

type Translate = ReturnType<typeof createTranslator>["t"]

type EmployeeTestKpiTone = "neutral" | "success" | "warning" | "danger"

export interface EmployeeTestKpiStat {
  id: "assigned" | "completed" | "inProgress" | "averageScore" | "overdue"
  label: string
  value: string
  icon: LucideIcon
  tone: EmployeeTestKpiTone
}

export function getEmployeeTestKpiStats(
  tests: EmployeeAssignedTest[],
  t: Translate
): EmployeeTestKpiStat[] {
  const assignedCount = tests.length
  const completedCount = tests.filter(isEmployeeTestFinished).length
  const inProgressCount = tests.filter((test) => test.status === "in_progress").length
  const overdueCount = tests.filter(isEmployeeTestOverdue).length

  const scoredTests = tests.filter((test) => test.score !== null)
  const averageScore =
    scoredTests.length === 0
      ? 0
      : Math.round(
          scoredTests.reduce((sum, test) => sum + (test.score ?? 0), 0) / scoredTests.length
        )

  return [
    {
      id: "assigned",
      label: t("kpi.employeeTests.assignedTests"),
      value: String(assignedCount),
      icon: ClipboardList,
      tone: "neutral",
    },
    {
      id: "completed",
      label: t("kpi.employeeTests.completedTests"),
      value: String(completedCount),
      icon: CheckCircle2,
      tone: "success",
    },
    {
      id: "inProgress",
      label: t("kpi.employeeTests.inProgress"),
      value: String(inProgressCount),
      icon: Loader2,
      tone: "warning",
    },
    {
      id: "averageScore",
      label: t("kpi.employeeTests.averageScore"),
      value: scoredTests.length > 0 ? `${averageScore}%` : t("common.dash"),
      icon: Target,
      tone: "neutral",
    },
    {
      id: "overdue",
      label: t("kpi.employeeTests.overdueTests"),
      value: String(overdueCount),
      icon: AlertTriangle,
      tone: overdueCount > 0 ? "danger" : "neutral",
    },
  ]
}

export function getEmployeeOverallProgress(
  tests: EmployeeAssignedTest[],
  t: Translate
): {
  completedCount: number
  totalCount: number
  label: string
} {
  const totalCount = tests.length
  const completedCount = tests.filter(isEmployeeTestFinished).length

  return {
    completedCount,
    totalCount,
    label:
      totalCount === 0
        ? t("kpi.employeeTests.noTestsAssigned")
        : t("kpi.employeeTests.testsCompleted", { completed: completedCount, total: totalCount }),
  }
}
