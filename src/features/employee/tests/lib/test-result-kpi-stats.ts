import type { LucideIcon } from "lucide-react"
import { AlertTriangle, CheckCircle2, Clock, Target, XCircle } from "lucide-react"

import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import { formatTestResultTimeSpent } from "@/features/employee/tests/lib/test-result-model"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"

export type TestResultKpiId = "score" | "correct" | "wrong" | "weakTopics" | "timeSpent"

export type TestResultKpiStatus = "passed" | "failed" | "neutral"

export interface TestResultKpiStat {
  id: TestResultKpiId
  label: string
  value: string
  icon: LucideIcon
  tone: KpiTone
  status: TestResultKpiStatus
}

export function getTestResultKpiStats(result: EmployeeTestResult): TestResultKpiStat[] {
  const scoreTone: KpiTone = result.passed ? "success" : "danger"
  const scoreStatus: TestResultKpiStatus = result.passed ? "passed" : "failed"

  return [
    {
      id: "score",
      label: "Score",
      value: `${result.score}%`,
      icon: Target,
      tone: scoreTone,
      status: scoreStatus,
    },
    {
      id: "correct",
      label: "Correct answers",
      value: String(result.correctCount),
      icon: CheckCircle2,
      tone: "success",
      status: "neutral",
    },
    {
      id: "wrong",
      label: "Wrong answers",
      value: String(result.wrongCount),
      icon: XCircle,
      tone: result.wrongCount > 0 ? "warning" : "neutral",
      status: "neutral",
    },
    {
      id: "weakTopics",
      label: "Weak topics",
      value: String(result.weakTopics.length),
      icon: AlertTriangle,
      tone: result.weakTopics.length > 0 ? "warning" : "neutral",
      status: "neutral",
    },
    {
      id: "timeSpent",
      label: "Time spent",
      value: formatTestResultTimeSpent(result.timeSpentMinutes),
      icon: Clock,
      tone: "neutral",
      status: "neutral",
    },
  ]
}
