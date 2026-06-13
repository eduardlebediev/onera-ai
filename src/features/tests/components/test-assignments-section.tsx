import Link from "next/link"

import type { TestAssignmentsSummary, TestStatus } from "@/features/tests/mock/tests"
import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestAssignmentsSectionProps {
  assignments: TestAssignmentsSummary
  testId: string
  testStatus: TestStatus
  isActive?: boolean
  sourceValidity?: string
  sourceInvalidReason?: string | null
}

function AssignmentStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function TestAssignmentsSection({
  assignments,
  testId,
  testStatus,
  isActive = true,
  sourceValidity = "valid",
  sourceInvalidReason,
}: TestAssignmentsSectionProps) {
  const canAssign = isTestAssignable({
    status: testStatus,
    isActive,
    sourceValidity,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <AssignmentStat label="Assigned" value={assignments.assigned} />
          <AssignmentStat label="Completed" value={assignments.completed} />
          <AssignmentStat label="In Progress" value={assignments.inProgress} />
          <AssignmentStat label="Not Started" value={assignments.notStarted} />
          <AssignmentStat label="Failed" value={assignments.failed ?? 0} />
        </div>
        {canAssign ? (
          <Button asChild className="w-full">
            <Link href={`/admin/tests/${testId}/assign`}>Assign to Employees</Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled
            title={
              sourceInvalidReason ??
              (testStatus !== "published"
                ? "Publish this test before assigning it to employees."
                : "This test is inactive because its source document is invalid.")
            }
          >
            Assign to Employees
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
