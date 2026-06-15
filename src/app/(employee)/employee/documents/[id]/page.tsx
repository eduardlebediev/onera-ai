import Link from "next/link"

import { requireEmployeeUser } from "@/features/auth/lib/require-auth"
import { isUuid, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { EmployeeSourceDocumentPage } from "@/features/employee/documents/components/employee-source-document-page"
import { getEmployeeSourceDocument } from "@/features/employee/documents/lib/get-employee-source-document"
import { getEmployeeTestResultHref } from "@/features/employee/documents/lib/employee-source-document-route"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export const dynamic = "force-dynamic"

interface EmployeeSourceDocumentRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ testId?: string; attemptId?: string }>
}

export default async function EmployeeSourceDocumentRoute({
  params,
  searchParams,
}: EmployeeSourceDocumentRouteProps) {
  const employee = await requireEmployeeUser()
  const { id } = await params
  const { testId, attemptId } = await searchParams
  const documentId = resolveApiDocumentId(id)

  if (!documentId) {
    return (
      <div className="page-shell-narrow">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="typography-h3 font-semibold">Source material not found</p>
            <p className="typography-p text-muted-foreground">
              This document is not available in your assigned tests.
            </p>
            <Button asChild variant="outline">
              <Link href="/employee/tests">Back to My Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const document = await getEmployeeSourceDocument({
    userId: employee.userId,
    organizationId: employee.membership.organizationId,
    documentId,
    testId: testId && isUuid(testId) ? testId : undefined,
  })

  if (!document) {
    return (
      <div className="page-shell-narrow">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="typography-h3 font-semibold">Source material not found</p>
            <p className="typography-p text-muted-foreground">
              You can only review source material for tests assigned to you.
            </p>
            <Button asChild variant="outline">
              <Link href="/employee/tests">Back to My Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const backHref =
    testId && isUuid(testId) ? getEmployeeTestResultHref(testId, attemptId) : "/employee/tests"
  const backLabel = testId && isUuid(testId) ? "Back to result" : "Back to My Tests"

  return (
    <EmployeeSourceDocumentPage
      document={document}
      testId={testId && isUuid(testId) ? testId : undefined}
      backHref={backHref}
      backLabel={backLabel}
    />
  )
}
