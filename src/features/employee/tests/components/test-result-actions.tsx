import Link from "next/link"
import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react"

import { getEmployeeSourceDocumentHref } from "@/features/employee/documents/lib/employee-source-document-route"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface TestResultActionsProps {
  testId: string
  attemptId?: string
  sourceDocumentId: string
  passed: boolean
  canRetake?: boolean
  retakeDisabledReason?: string
}

export function TestResultActions({
  testId,
  attemptId,
  sourceDocumentId,
  passed,
  canRetake,
  retakeDisabledReason,
}: TestResultActionsProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h2 className="typography-h3 font-semibold">Next Steps</h2>

        <Button asChild className="w-full">
          <Link href="/employee/tests">
            <ArrowLeft className="size-4" />
            Back to My Tests
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href={getEmployeeSourceDocumentHref(sourceDocumentId, { testId, attemptId })}>
            <BookOpen className="size-4" />
            Review Source Material
          </Link>
        </Button>

        {!passed ? (
          canRetake ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/employee/tests/${testId}/take`}>
                <RotateCcw className="size-4" />
                Retake Test
              </Link>
            </Button>
          ) : (
            <span
              className="block"
              title={retakeDisabledReason ?? "Retake is not available for this test"}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled
                aria-label={`Retake ${testId} disabled: ${retakeDisabledReason ?? "Retake unavailable"}`}
              >
                <RotateCcw className="size-4" />
                Retake Test
              </Button>
            </span>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
