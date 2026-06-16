"use client"

import { useEffect, useState } from "react"
import { Maximize2, X } from "lucide-react"
import Link from "next/link"

import { EmployeeTestDetail } from "@/features/employee/tests/components/employee-test-detail"
import { TestResultPage } from "@/features/employee/tests/components/test-result-page"
import {
  getEmployeeTestFullPageHref,
  shouldLoadEmployeeTestResult,
} from "@/features/employee/tests/lib/employee-test-model"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"

interface EmployeeTestDrawerProps {
  test: EmployeeAssignedTest | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EmployeeTestResultResponse = {
  result?: EmployeeTestResult
  error?: string
}

export function EmployeeTestDrawer({ test, open, onOpenChange }: EmployeeTestDrawerProps) {
  const { t } = useTranslation()
  const [result, setResult] = useState<EmployeeTestResult | null>(null)
  const [resultError, setResultError] = useState<string | null>(null)
  const [isResultLoading, setIsResultLoading] = useState(false)

  const shouldLoadResult = test ? shouldLoadEmployeeTestResult(test) : false
  const fullPageHref = test ? getEmployeeTestFullPageHref(test) : null

  useEffect(() => {
    if (!open || !test || !shouldLoadResult || !test.latestAttemptId) {
      return
    }

    const controller = new AbortController()
    const testId = test.id
    const attemptId = test.latestAttemptId

    async function loadResult() {
      setResult(null)
      setResultError(null)
      setIsResultLoading(true)

      try {
        const response = await fetch(
          `/api/employee/tests/${testId}/result?attemptId=${attemptId}`,
          { signal: controller.signal }
        )
        const payload = (await response
          .json()
          .catch(() => null)) as EmployeeTestResultResponse | null

        if (!response.ok || !payload?.result) {
          throw new Error(payload?.error ?? t("errors.notFound"))
        }

        setResult(payload.result)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setResultError(error instanceof Error ? error.message : t("errors.generic"))
      } finally {
        if (!controller.signal.aborted) {
          setIsResultLoading(false)
        }
      }
    }

    void loadResult()

    return () => {
      controller.abort()
    }
  }, [open, shouldLoadResult, t, test])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        aria-describedby={undefined}
        className="h-[90vh] overflow-hidden bg-background"
        leftAction={
          test && fullPageHref ? (
            <Button asChild variant="ghost" size="icon">
              <Link href={fullPageHref} aria-label={t("tests.detail.drawer.openFullPage")}>
                <Maximize2 className="size-4" />
              </Link>
            </Button>
          ) : null
        }
        rightAction={
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label={t("common.close")}>
              <X className="size-4" />
            </Button>
          </DrawerClose>
        }
      >
        <DrawerTitle className="sr-only">
          {test?.title ?? t("tests.detail.drawer.testPreview")}
        </DrawerTitle>
        {test ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            {shouldLoadResult ? (
              isResultLoading ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="typography-h3 font-semibold">{t("common.loading")}</p>
                  </div>
                </div>
              ) : resultError ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="typography-h3 font-semibold">{t("errors.notFound")}</p>
                    <p className="mt-2 max-w-md typography-p text-muted-foreground">
                      {resultError}
                    </p>
                    {fullPageHref ? (
                      <Button asChild variant="outline" className="mt-4">
                        <Link href={fullPageHref}>{t("tests.detail.drawer.openFullPage")}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : result ? (
                <TestResultPage result={result} showBreadcrumbs={false} />
              ) : null
            ) : (
              <EmployeeTestDetail test={test} showBreadcrumbs={false} />
            )}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
