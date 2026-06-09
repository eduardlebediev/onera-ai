"use client"

import { AlertCircle, Loader2 } from "lucide-react"

import {
  canConfirmAssignment,
  formatAssignmentDeadline,
  type AssignmentSummary,
} from "@/features/tests/lib/assign-employees-model"
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
  const canAssign = canConfirmAssignment(summary.selectedCount, deadline)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <SummaryRow label="Selected test" value={testTitle} />
          <SummaryRow label="Selected employees" value={summary.selectedCount} />
          <SummaryRow label="Deadline" value={formatAssignmentDeadline(deadline)} />
          <SummaryRow label="Already assigned" value={summary.alreadyAssignedCount} />
          <SummaryRow label="New assignments" value={summary.newAssignmentsCount} />
        </div>

        {!canAssign && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/20">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="typography-small text-amber-800 dark:text-amber-300">
              {summary.selectedCount === 0
                ? "Select at least one employee to assign this test."
                : "Set a deadline before assigning this test."}
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
          {isAssigning ? "Assigning..." : "Assign Test"}
        </Button>
      </CardContent>
    </Card>
  )
}
