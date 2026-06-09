import type { LucideIcon } from "lucide-react"
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, Target } from "lucide-react"

import { isEmployeeTestFinished } from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import { getDaysUntilDeadline } from "@/features/employee/tests/lib/employee-test-format"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"

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
  return daysUntil >= 0 && daysUntil <= DUE_SOON_DAYS
}

export function getEmployeeDashboardKpiStats(
  tests: EmployeeAssignedTest[],
  weakTopicCount: number
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
      label: "Assigned Tests",
      value: String(assignedCount),
      icon: ClipboardList,
      tone: "neutral",
      status: "assigned",
    },
    {
      label: "Due Soon",
      value: String(dueSoonCount),
      icon: AlertTriangle,
      tone: dueSoonCount > 0 ? "warning" : "neutral",
      status: "dueSoon",
    },
    {
      label: "Completed Tests",
      value: String(completedCount),
      icon: CheckCircle2,
      tone: "success",
      status: "completed",
    },
    {
      label: "Average Score",
      value: scoredTests.length > 0 ? `${averageScore}%` : "—",
      icon: Target,
      tone: "neutral",
      status: "averageScore",
    },
    {
      label: "Weak Topics",
      value: String(weakTopicCount),
      icon: BookOpen,
      tone: weakTopicCount > 0 ? "warning" : "neutral",
      status: "weakTopics",
    },
  ]
}
