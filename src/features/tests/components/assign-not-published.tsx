import Link from "next/link"

import { AssignBreadcrumb } from "@/features/tests/components/assign-breadcrumb"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface AssignNotPublishedProps {
  test: ResolvedMockTest
  inactive?: boolean
}

export function AssignNotPublished({ test, inactive = false }: AssignNotPublishedProps) {
  return (
    <div className="page-shell-narrow">
      <AssignBreadcrumb testId={test.id} testTitle={test.title} className="mb-6" />

      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <h1 className="typography-h2">Test not available for assignment</h1>
          <p className="typography-p text-muted-foreground">
            {inactive
              ? (test.sourceInvalidReason ??
                "This test is inactive because its source document is invalid.")
              : "Publish this test before assigning it to employees."}
          </p>
          <Button asChild>
            <Link href={`/admin/tests/${test.id}`}>Back to Test Detail</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
