"use client"

import { Maximize2, X } from "lucide-react"
import Link from "next/link"

import type { ResolvedTestListItem } from "@/features/tests/lib/test-source-document"
import { formatTestDate } from "@/features/tests/lib/test-format"
import {
  isSourceBlockingValidity,
  normalizeTestSourceValidity,
  TEST_SOURCE_VALIDITY_STYLE,
  getTestSourceValidityLabel,
} from "@/features/tests/lib/test-source-validity-style"
import { getTestStatusLabel, TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { useTranslation } from "@/shared/i18n/use-translation"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"

interface TestDrawerProps {
  test: ResolvedTestListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function PreviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="typography-small text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function TestDrawer({ test, open, onOpenChange }: TestDrawerProps) {
  const { t, locale } = useTranslation()
  const statusStyle = test ? TEST_STATUS_STYLE[test.status] : null
  const sourceValidity = test ? normalizeTestSourceValidity(test.sourceValidity) : "valid"
  const sourceValidityStyle = TEST_SOURCE_VALIDITY_STYLE[sourceValidity]

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        aria-describedby={undefined}
        className="h-[90vh] overflow-hidden bg-background"
        leftAction={
          test ? (
            <Button asChild variant="ghost" size="icon">
              <Link
                href={`/admin/tests/${test.id}`}
                aria-label={t("tests.detail.drawer.openFullPage")}
              >
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
        {test && statusStyle ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <div className="page-shell-narrow">
              <div className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("status-badge", statusStyle.listBadgeClass)}
                  >
                    <span className={`mr-1 size-1.5 rounded-full ${statusStyle.dotClass}`} />
                    {getTestStatusLabel(test.status, t)}
                  </Badge>
                  {test.isActive === false ? (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700"
                    >
                      {t("status.test.inactive")}
                    </Badge>
                  ) : null}
                  {isSourceBlockingValidity(sourceValidity) ? (
                    <Badge variant="outline" className={sourceValidityStyle.badgeClass}>
                      {getTestSourceValidityLabel(sourceValidity, t)}
                    </Badge>
                  ) : null}
                </div>
                {test.description ? (
                  <p className="typography-p max-w-3xl text-muted-foreground">{test.description}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("tests.detail.drawer.testSummary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <PreviewMetric
                      label={t("dataTable.difficulty")}
                      value={t(`common.difficulty.${test.difficulty}`)}
                    />
                    <PreviewMetric label={t("dataTable.language")} value={test.language} />
                    <PreviewMetric label={t("dataTable.targetRole")} value={test.targetRole} />
                    <PreviewMetric
                      label={t("dataTable.passingScore")}
                      value={t("common.percent", { value: test.passingScore })}
                    />
                    <PreviewMetric label={t("common.questions")} value={test.questionCount} />
                    <PreviewMetric
                      label={t("dataTable.created")}
                      value={formatTestDate(locale, test.createdAt)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("dataTable.sourceDocument")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {test.sourceDocument.title}
                      </p>
                      <p className="mt-1 typography-small text-muted-foreground">
                        {t("tests.detail.drawer.chunksSelected", {
                          count: test.sourceDocument.chunksUsed,
                        })}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/documents/${test.sourceDocument.documentId}`}>
                        {t("tests.detail.drawer.openDocument")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-2">
                <CardHeader>
                  <CardTitle>{t("tests.detail.drawer.selectedTopics")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {test.selectedTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {test.selectedTopics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="font-normal">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="typography-small text-muted-foreground">
                      {t("tests.detail.drawer.noTopicMetadata")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
