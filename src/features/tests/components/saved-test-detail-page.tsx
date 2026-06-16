"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { GenerateLatestVersionDraftButton } from "@/features/tests/components/generate-latest-version-draft-button"
import {
  SavedTestLifecycleActionsMenu,
  SavedTestLifecycleActionsPanel,
  SavedTestLifecycleActionsProvider,
} from "@/features/tests/components/saved-test-lifecycle-actions"
import { TestAssignmentsSection } from "@/features/tests/components/test-assignments-section"
import { TestResultsSection } from "@/features/tests/components/test-results-section"
import {
  formatAssignmentDeadline,
  formatAssignmentStatus,
} from "@/features/tests/lib/assign-employees-model"
import { TestSourceDocumentsSection } from "@/features/tests/components/test-source-documents-section"
import {
  isSourceBlockingValidity,
  normalizeTestSourceValidity,
  TEST_SOURCE_VALIDITY_STYLE,
  getTestSourceValidityLabel,
} from "@/features/tests/lib/test-source-validity-style"
import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"
import type { SupabaseAssignmentSummary } from "@/features/tests/lib/supabase-assignments"
import type { SavedTestDetail } from "@/features/tests/lib/supabase-test-detail"
import type { SupabaseEmployeeProgress } from "@/features/tests/lib/supabase-test-progress"
import type { TestLifecycleImpact } from "@/features/tests/lib/test-lifecycle-api-client"
import type { TestResultsSummary, TestStatus } from "@/features/tests/types/test"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { getTestStatusLabel, TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { formatDateTime } from "@/shared/i18n/format"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface SavedTestDetailPageProps {
  test: SavedTestDetail
  assignmentSummary?: SupabaseAssignmentSummary
  assignedEmployees?: SupabaseEmployeeProgress[]
  results?: TestResultsSummary | null
  lifecycleImpact: TestLifecycleImpact
}

function formatLanguage(language: string, t: ReturnType<typeof useTranslation>["t"]): string {
  return language === "de" ? t("common.language.de") : t("common.language.en")
}

function formatAttemptStatus(
  status: SupabaseEmployeeProgress["attemptStatus"],
  t: ReturnType<typeof useTranslation>["t"]
): string {
  if (!status) return t("common.dash")

  switch (status) {
    case "in_progress":
      return t("status.assignment.inProgress")
    case "completed":
      return t("status.assignment.completed")
    case "abandoned":
      return t("status.assignment.abandoned")
    default:
      return t("common.dash")
  }
}

function getCorrectOptionTexts(question: SavedTestDetail["questions"][number]): string[] {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]))

  return question.correctAnswer.optionIds
    .map((optionId) => optionById.get(optionId))
    .filter((text): text is string => Boolean(text))
}

function emptyResults(): TestResultsSummary {
  return {
    averageScore: 0,
    passRate: 0,
    weakTopics: [],
    recentAttempts: [],
  }
}

export function SavedTestDetailPage({
  test,
  assignmentSummary,
  assignedEmployees = [],
  results,
  lifecycleImpact,
}: SavedTestDetailPageProps) {
  const { locale, t } = useTranslation()
  const testStatus = test.status as TestStatus
  const resultsSummary = results ?? emptyResults()
  const sourceValidity = normalizeTestSourceValidity(test.sourceValidity)
  const sourceValidityStyle = TEST_SOURCE_VALIDITY_STYLE[sourceValidity]
  const canAssign =
    test.status === "published" &&
    isTestAssignable({
      status: test.status,
      isActive: test.isActive,
      sourceValidity: test.sourceValidity,
    })

  return (
    <SavedTestLifecycleActionsProvider
      testId={test.id}
      title={test.title}
      description={test.description}
      status={test.status}
      difficulty={test.difficulty}
      passingScore={test.passingScore}
      targetRole={test.targetRole}
      impact={lifecycleImpact}
    >
      <div className="page-shell-narrow">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="typography-h1">{test.title}</h1>
              {test.description ? (
                <p className="typography-p text-muted-foreground">{test.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("status-badge", TEST_STATUS_STYLE[testStatus].listBadgeClass)}
                >
                  {getTestStatusLabel(testStatus, t)}
                </Badge>
                {!test.isActive ? (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    {t("status.test.inactive")}
                  </Badge>
                ) : null}
                {isSourceBlockingValidity(sourceValidity) ? (
                  <Badge variant="outline" className={sourceValidityStyle.badgeClass}>
                    {getTestSourceValidityLabel(sourceValidity, t)}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="capitalize">
                  {t(`common.difficulty.${test.difficulty as "easy" | "medium" | "hard"}`)}
                </Badge>
                <Badge variant="outline">{formatLanguage(test.language, t)}</Badge>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
              {canAssign ? (
                <>
                  <Button asChild>
                    <Link href={`/admin/tests/${test.id}/assign`}>
                      {t("tests.detail.assignToEmployees")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="#results">{t("tests.detail.viewResults")}</Link>
                  </Button>
                </>
              ) : test.status === "published" ? (
                <Button disabled title={test.sourceInvalidReason ?? t("tests.detail.inactiveTest")}>
                  {t("tests.detail.assignToEmployees")}
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/admin/tests">{t("tests.detail.backToTests")}</Link>
              </Button>
              <SavedTestLifecycleActionsMenu />
            </div>
          </div>

          <Breadcrumbs
            items={[{ label: t("nav.tests"), href: "/admin/tests" }, { label: test.title }]}
          />

          <SavedTestLifecycleActionsPanel />

          {!test.sourceDocumentIsLatest && test.sourceDocumentId && test.latestSourceDocumentId ? (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20">
              <CardContent className="flex flex-col gap-4 p-4 text-sm text-orange-800 dark:text-orange-300 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">{t("tests.detail.outdatedSourceBanner.title")}</p>
                    <p className="mt-1">{t("tests.detail.outdatedSourceBanner.body")}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button asChild variant="outline">
                    <Link href={`/admin/documents/${test.sourceDocumentId}`}>
                      {t("tests.detail.outdatedSourceBanner.openSourceVersion")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/admin/documents/${test.latestSourceDocumentId}`}>
                      {t("tests.detail.outdatedSourceBanner.openLatestVersion")}
                    </Link>
                  </Button>
                  <GenerateLatestVersionDraftButton
                    documentId={test.latestSourceDocumentId}
                    templateTestId={test.id}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isSourceBlockingValidity(sourceValidity) ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
              <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-800 dark:text-red-300">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {sourceValidity === "source_archived"
                        ? t("tests.detail.sourceArchivedTitle")
                        : t("tests.detail.sourceDeletedTitle")}
                    </p>
                    <p className="mt-1">
                      {test.sourceInvalidReason ?? t("tests.detail.sourceInvalidDefault")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("tests.detail.savedTestSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm md:grid-cols-2">
              <p>
                <span className="font-medium">{t("tests.detail.passingScoreLabel")}</span>{" "}
                {test.passingScore}%
              </p>
              <p>
                <span className="font-medium">{t("tests.detail.questionCountLabel")}</span>{" "}
                {test.questionCount}
              </p>
              <p>
                <span className="font-medium">{t("tests.detail.targetRoleLabel")}</span>{" "}
                {test.targetRole ?? t("tests.detail.notSpecified")}
              </p>
              <p>
                <span className="font-medium">{t("tests.detail.sourceDocumentsLabel")}</span>{" "}
                {test.sourceDocuments.length > 0
                  ? test.sourceDocuments.map((document) => document.title).join(", ")
                  : (test.sourceDocumentTitle ?? t("common.unknownDocument"))}
              </p>
              {test.publishedAt ? (
                <p className="md:col-span-2">
                  <span className="font-medium">{t("tests.detail.publishedAtLabel")}</span>{" "}
                  {formatDateTime(locale, test.publishedAt)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            {test.questions.map((question, index) => {
              const correctTexts = getCorrectOptionTexts(question)

              return (
                <Card key={question.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {t("tests.detail.questionNumber", { number: index + 1 })}
                      {question.topic ? (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          · {question.topic}
                        </span>
                      ) : null}
                    </CardTitle>
                    {question.sourceLabel ? (
                      <p className="mt-1 typography-small text-muted-foreground">
                        {t("tests.detail.sourcePrefix")} {question.sourceLabel}
                      </p>
                    ) : null}
                    {!question.isActive ? (
                      <p className="mt-1 typography-small text-amber-700">
                        {question.sourceInvalidReason ?? t("tests.detail.questionSourceInvalid")}
                      </p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="font-medium">{question.questionText}</p>
                    <ul className="space-y-1">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className={
                            correctTexts.includes(option.text)
                              ? "font-medium text-emerald-700 dark:text-emerald-300"
                              : "text-muted-foreground"
                          }
                        >
                          {option.text}
                        </li>
                      ))}
                    </ul>
                    {question.explanation ? (
                      <p>
                        <span className="font-medium">{t("tests.detail.explanationLabel")}</span>{" "}
                        {question.explanation}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}

            <TestResultsSection results={resultsSummary} id="results" />
          </div>

          <div className="space-y-2">
            {test.sourceDocuments.length > 0 ? (
              <TestSourceDocumentsSection sources={test.sourceDocuments} />
            ) : null}
            {assignmentSummary ? (
              <TestAssignmentsSection
                assignments={assignmentSummary}
                testId={test.id}
                testStatus={test.status === "published" ? "published" : "draft"}
                isActive={test.isActive}
                sourceValidity={test.sourceValidity}
                sourceInvalidReason={test.sourceInvalidReason}
              />
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("tests.detail.assignedEmployeesTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignedEmployees.length > 0 ? (
                  assignedEmployees.map((employee) => (
                    <div
                      key={employee.assignmentId}
                      className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{employee.name}</p>
                          <p className="typography-small text-muted-foreground">{employee.email}</p>
                        </div>
                        <Badge variant="outline">
                          {formatAssignmentStatus(employee.assignmentStatus, t)}
                        </Badge>
                      </div>
                      <div className="mt-2 grid gap-1 typography-small text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">
                            {t("tests.detail.scoreLabel")}
                          </span>{" "}
                          {employee.score !== null
                            ? t("common.percent", { value: employee.score })
                            : t("common.dash")}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            {t("tests.detail.resultLabel")}
                          </span>{" "}
                          {employee.resultLabel}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            {t("tests.detail.attemptLabel")}
                          </span>{" "}
                          {formatAttemptStatus(employee.attemptStatus, t)}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            {t("tests.detail.completedLabel")}
                          </span>{" "}
                          {employee.completedAt
                            ? formatTestDate(locale, employee.completedAt)
                            : t("common.dash")}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            {t("tests.detail.deadlineLabel")}
                          </span>{" "}
                          {formatAssignmentDeadline(locale, employee.deadline ?? "", t)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="typography-small text-muted-foreground">
                    {t("tests.detail.noEmployeesAssigned")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SavedTestLifecycleActionsProvider>
  )
}
