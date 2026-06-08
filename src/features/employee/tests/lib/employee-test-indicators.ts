import type { LucideIcon } from "lucide-react"
import { AlertTriangle, ClipboardList, Clock, Target } from "lucide-react"

import { getDaysUntilDeadline } from "@/features/employee/tests/lib/employee-test-format"
import {
  isEmployeeTestFinished,
  isEmployeeTestOverdue,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"

export type EmployeeTestPriorityIndicatorId = "overdue" | "due_soon" | "low_score" | "required"

export interface EmployeeTestPriorityIndicator {
  id: EmployeeTestPriorityIndicatorId
  label: string
  icon: LucideIcon
  className: string
}

function isDueSoon(test: EmployeeAssignedTest): boolean {
  if (isEmployeeTestFinished(test)) return false
  const days = getDaysUntilDeadline(test.deadline)
  return days >= 0 && days <= 3
}

export function getEmployeeTestPriorityIndicators(
  test: EmployeeAssignedTest
): EmployeeTestPriorityIndicator[] {
  const indicators: EmployeeTestPriorityIndicator[] = []

  if (isEmployeeTestOverdue(test)) {
    indicators.push({
      id: "overdue",
      label: "Overdue",
      icon: AlertTriangle,
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400",
    })
  } else if (isDueSoon(test)) {
    indicators.push({
      id: "due_soon",
      label: "Due soon",
      icon: Clock,
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400",
    })
  }

  if (test.required) {
    indicators.push({
      id: "required",
      label: "Required",
      icon: ClipboardList,
      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400",
    })
  }

  if (test.score !== null && test.passed === false && test.score < test.passingScore) {
    indicators.push({
      id: "low_score",
      label: "Low score",
      icon: Target,
      className:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-900/20 dark:text-orange-400",
    })
  }

  return indicators
}
