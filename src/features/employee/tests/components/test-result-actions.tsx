import Link from "next/link"
import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface TestResultActionsProps {
  testId: string
  sourceDocumentId: string
}

export function TestResultActions({ testId, sourceDocumentId }: TestResultActionsProps) {
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
          <Link href={`/admin/documents/${sourceDocumentId}`}>
            <BookOpen className="size-4" />
            Review Source Material
          </Link>
        </Button>

        <span className="block" title="Test already completed">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled
            aria-label={`Retake ${testId} disabled: Test already completed`}
          >
            <RotateCcw className="size-4" />
            Retake Test
          </Button>
        </span>
      </CardContent>
    </Card>
  )
}
