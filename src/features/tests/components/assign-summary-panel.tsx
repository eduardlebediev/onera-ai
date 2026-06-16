"use client"

import { AlertCircle, Loader2 } from "lucide-react"

import {
  canConfirmAssignment,
  formatAssignmentDeadline,
  type AssignmentSummary,
} from "@/features/tests/lib/assign-employees-model"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { SummaryRow } from "@/shared/ui/summary-row"

interface AssignSummaryPanelProps {
  testTitle: string
  deadline: string
  summary: AssignmentSummary
  isAssigning?: boolean
  onAssign: () => void
}

export function AssignSummaryPanel({
  testTitle,
  deadline,
  summary,
  isAssigning = false,
  onAssign,
}: AssignSummaryPanelProps) {
  const { locale, t } = useTranslation()
  const canAssign = canConfirmAssignment(summary.selectedCount, deadline)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tests.assign.summary.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <SummaryRow label={t("tests.assign.summary.selectedTest")} value={testTitle} />
          <SummaryRow
            label={t("tests.assign.summary.selectedEmployees")}
            value={summary.selectedCount}
          />
          <SummaryRow
            label={t("tests.assign.summary.deadline")}
            value={formatAssignmentDeadline(locale, deadline, t)}
          />
          <SummaryRow
            label={t("tests.assign.summary.alreadyAssigned")}
            value={summary.alreadyAssignedCount}
          />
          <SummaryRow
            label={t("tests.assign.summary.newAssignments")}
            value={summary.newAssignmentsCount}
          />
        </div>

        {!canAssign && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/20">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="typography-small text-amber-800 dark:text-amber-300">
              {summary.selectedCount === 0
                ? t("tests.assign.summary.selectEmployee")
                : t("tests.assign.summary.setDeadline")}
            </p>
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={!canAssign || isAssigning}
          onClick={onAssign}
        >
          {isAssigning ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isAssigning ? t("tests.assign.summary.assigning") : t("tests.assign.summary.assignTest")}
        </Button>
      </CardContent>
    </Card>
  )
}
