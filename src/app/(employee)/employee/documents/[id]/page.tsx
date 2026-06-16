import Link from "next/link"

import { requireEmployeeUser } from "@/features/auth/lib/require-auth"
import { isUuid, resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { EmployeeSourceDocumentPage } from "@/features/employee/documents/components/employee-source-document-page"
import { getEmployeeSourceDocument } from "@/features/employee/documents/lib/get-employee-source-document"
import { getEmployeeTestResultHref } from "@/features/employee/documents/lib/employee-source-document-route"
import { getTranslator } from "@/shared/i18n/get-locale"
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
  const { t } = await getTranslator()
  const { id } = await params
  const { testId, attemptId } = await searchParams
  const documentId = resolveApiDocumentId(id)

  if (!documentId) {
    return (
      <div className="page-shell-narrow">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="typography-h3 font-semibold">{t("employee.sourceDocument.notFound")}</p>
            <p className="typography-p text-muted-foreground">
              {t("employee.sourceDocument.notFoundAssigned")}
            </p>
            <Button asChild variant="outline">
              <Link href="/employee/tests">{t("employee.result.backToMyTests")}</Link>
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
            <p className="typography-h3 font-semibold">{t("employee.sourceDocument.notFound")}</p>
            <p className="typography-p text-muted-foreground">
              {t("employee.sourceDocument.notFoundAccess")}
            </p>
            <Button asChild variant="outline">
              <Link href="/employee/tests">{t("employee.result.backToMyTests")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const backHref =
    testId && isUuid(testId) ? getEmployeeTestResultHref(testId, attemptId) : "/employee/tests"
  const backLabel =
    testId && isUuid(testId)
      ? t("employee.sourceDocument.backLabel")
      : t("employee.result.backToMyTests")

  return (
    <EmployeeSourceDocumentPage
      document={document}
      testId={testId && isUuid(testId) ? testId : undefined}
      backHref={backHref}
      backLabel={backLabel}
    />
  )
}
