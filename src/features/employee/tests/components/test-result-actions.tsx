"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react"

import { getEmployeeSourceDocumentHref } from "@/features/employee/documents/lib/employee-source-document-route"
import { useTranslation } from "@/shared/i18n/use-translation"
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
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h2 className="typography-h3 font-semibold">{t("employee.result.nextSteps")}</h2>

        <Button asChild className="w-full">
          <Link href="/employee/tests">
            <ArrowLeft className="size-4" />
            {t("employee.result.backToMyTests")}
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href={getEmployeeSourceDocumentHref(sourceDocumentId, { testId, attemptId })}>
            <BookOpen className="size-4" />
            {t("employee.result.reviewSourceMaterial")}
          </Link>
        </Button>

        {!passed ? (
          canRetake ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/employee/tests/${testId}/take`}>
                <RotateCcw className="size-4" />
                {t("employee.result.retakeTest")}
              </Link>
            </Button>
          ) : (
            <span
              className="block"
              title={retakeDisabledReason ?? t("employee.result.retakeUnavailable")}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled
                aria-label={`${t("employee.result.retakeTest")}: ${retakeDisabledReason ?? t("employee.result.retakeDisabled")}`}
              >
                <RotateCcw className="size-4" />
                {t("employee.result.retakeTest")}
              </Button>
            </span>
          )
        ) : null}
      </CardContent>
    </Card>
  )
}
