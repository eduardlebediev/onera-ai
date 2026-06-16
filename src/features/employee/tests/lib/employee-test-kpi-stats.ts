import type { LucideIcon } from "lucide-react"
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Target } from "lucide-react"

import {
  isEmployeeTestFinished,
  isEmployeeTestOverdue,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"

type EmployeeTestKpiTone = "neutral" | "success" | "warning" | "danger"

export interface EmployeeTestKpiStat {
  id: "assigned" | "completed" | "inProgress" | "averageScore" | "overdue"
  label: string
  value: string
  icon: LucideIcon
  tone: EmployeeTestKpiTone
}

export function getEmployeeTestKpiStats(tests: EmployeeAssignedTest[]): EmployeeTestKpiStat[] {
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
      label: "Assigned Tests",
      value: String(assignedCount),
      icon: ClipboardList,
      tone: "neutral",
    },
    {
      id: "completed",
      label: "Completed Tests",
      value: String(completedCount),
      icon: CheckCircle2,
      tone: "success",
    },
    {
      id: "inProgress",
      label: "In Progress",
      value: String(inProgressCount),
      icon: Loader2,
      tone: "warning",
    },
    {
      id: "averageScore",
      label: "Average Score",
      value: scoredTests.length > 0 ? `${averageScore}%` : "—",
      icon: Target,
      tone: "neutral",
    },
    {
      id: "overdue",
      label: "Overdue Tests",
      value: String(overdueCount),
      icon: AlertTriangle,
      tone: overdueCount > 0 ? "danger" : "neutral",
    },
  ]
}

export function getEmployeeOverallProgress(tests: EmployeeAssignedTest[]): {
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
        ? "No tests assigned yet"
        : `${completedCount} of ${totalCount} tests completed`,
  }
}
