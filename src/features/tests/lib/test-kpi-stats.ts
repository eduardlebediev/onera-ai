import type { LucideIcon } from "lucide-react"
import { CheckCircle2, ClipboardList, FileEdit, Target, Users } from "lucide-react"

import type { TestListItem, TestStatus } from "@/features/tests/types/test"

type TestKpiTone = "neutral" | "success" | "warning" | "danger"

export interface TestKpiStat {
  id: "total" | "published" | "draft" | "avgPassingScore" | "attempts"
  label: string
  value: string
  icon: LucideIcon
  tone: TestKpiTone
  status?: TestStatus
}

export function getTestKpiStats(tests: TestListItem[]): TestKpiStat[] {
  const totalCount = tests.length
  const publishedCount = tests.filter((test) => test.status === "published").length
  const draftCount = tests.filter((test) => test.status === "draft").length
  const avgPassingScore =
    totalCount === 0
      ? 0
      : Math.round(tests.reduce((sum, test) => sum + test.passingScore, 0) / totalCount)
  const totalAttempts = tests.reduce((sum, test) => sum + test.attemptsCount, 0)

  return [
    {
      id: "total",
      label: "Total Tests",
      value: String(totalCount),
      icon: ClipboardList,
      tone: "neutral",
    },
    {
      id: "published",
      label: "Published Tests",
      value: String(publishedCount),
      icon: CheckCircle2,
      tone: "success",
      status: "published",
    },
    {
      id: "draft",
      label: "Draft Tests",
      value: String(draftCount),
      icon: FileEdit,
      tone: "warning",
      status: "draft",
    },
    {
      id: "avgPassingScore",
      label: "Average Passing Score",
      value: `${avgPassingScore}%`,
      icon: Target,
      tone: "neutral",
    },
    {
      id: "attempts",
      label: "Total Attempts",
      value: String(totalAttempts),
      icon: Users,
      tone: "neutral",
    },
  ]
}
