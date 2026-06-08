import Link from "next/link"

import { AssignBreadcrumb } from "@/features/tests/components/assign-breadcrumb"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface AssignNotPublishedProps {
  test: ResolvedMockTest
}

export function AssignNotPublished({ test }: AssignNotPublishedProps) {
  return (
    <div className="page-shell max-w-3xl">
      <AssignBreadcrumb testId={test.id} testTitle={test.title} className="mb-6" />

      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <h1 className="typography-h2">Test not available for assignment</h1>
          <p className="typography-p text-muted-foreground">
            Publish this test before assigning it to employees.
          </p>
          <Button asChild>
            <Link href={`/tests/${test.id}`}>Back to Test Detail</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
