"use client"

import { Rocket, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { PublishApprovedQuestions } from "@/features/tests/components/publish-approved-questions"
import { PublishReadinessCard } from "@/features/tests/components/publish-readiness-card"
import { PublishSuccessState } from "@/features/tests/components/publish-success-state"
import { PublishTestSummary } from "@/features/tests/components/publish-test-summary"
import { mapReviewedDraftToPublishRequest } from "@/features/tests/lib/generated-test-mapper"
import {
  loadGeneratedTestDraft,
  clearGeneratedTestDraft,
} from "@/features/tests/lib/generated-test-session"
import {
  PUBLISH_GENERATED_TEST_ERROR_MESSAGE,
  publishGeneratedTest,
} from "@/features/tests/lib/publish-generated-test-api-client"
import {
  buildPublishContext,
  getApprovedQuestions,
  getPublishableQuestions,
  getPublishBlockReason,
  getPublishReadinessChecks,
  isPublishReady,
  resolvePublishedTestId,
  type PublishTestContext,
} from "@/features/tests/lib/publish-test-model"
import { useResolvedReviewData } from "@/features/tests/lib/use-resolved-review-data"
import type { ReviewDataSource } from "@/features/tests/lib/use-resolved-review-data"
import type { TestReviewData } from "@/features/tests/types/review"
import type { StoredGeneratedTestDraft } from "@/features/tests/types/generated-test"
import type { DocumentDetail } from "@/features/documents/types/document"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { useTranslation } from "@/shared/i18n/use-translation"

interface PublishTestPageProps {
  document: DocumentDetail
  reviewData: TestReviewData
  documentId: string
  generationRunId?: string | null
  reviewDataSource?: Exclude<ReviewDataSource, "session">
  recoveredDraft?: StoredGeneratedTestDraft | null
}

export function PublishTestPage({
  document,
  reviewData: initialReviewData,
  documentId,
  generationRunId: routeGenerationRunId,
  reviewDataSource = "supabase",
  recoveredDraft = null,
}: PublishTestPageProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [published, setPublished] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [savedTestId, setSavedTestId] = useState<string | null>(null)

  const {
    reviewData: resolvedReviewData,
    questions,
    isAiDraft,
    isHydrated,
  } = useResolvedReviewData(documentId, initialReviewData, routeGenerationRunId, reviewDataSource)

  const reviewData = useMemo(
    () => ({
      ...resolvedReviewData,
      questions,
    }),
    [resolvedReviewData, questions]
  )

  const context = useMemo<PublishTestContext>(
    () => buildPublishContext(document, reviewData),
    [document, reviewData]
  )

  const readinessChecks = useMemo(() => getPublishReadinessChecks(context, t), [context, t])
  const canPublish = useMemo(() => isPublishReady(readinessChecks), [readinessChecks])
  const blockReason = useMemo(
    () => (canPublish ? undefined : getPublishBlockReason(readinessChecks, t)),
    [canPublish, readinessChecks, t]
  )
  const approvedQuestions = useMemo(() => getApprovedQuestions(reviewData), [reviewData])
  const questionsToPublish = useMemo(
    () => (isAiDraft ? getPublishableQuestions(reviewData) : approvedQuestions),
    [approvedQuestions, isAiDraft, reviewData]
  )
  const publishedTestId = useMemo(
    () => savedTestId ?? resolvePublishedTestId(document.id),
    [document.id, savedTestId]
  )

  const handleSaveDraft = () => {
    setDraftSaved(true)
    toast.success(t("tests.publish.draftSavedToast"))
  }

  const handlePublish = async () => {
    if (!canPublish || isPublishing || !isHydrated) return

    setPublishError(null)
    setIsPublishing(true)

    if (isAiDraft) {
      const storedDraft = loadGeneratedTestDraft() ?? recoveredDraft

      if (!storedDraft) {
        setPublishError(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
        toast.error(`${t("tests.publish.publishFailed")} ${PUBLISH_GENERATED_TEST_ERROR_MESSAGE}`)
        setIsPublishing(false)
        return
      }

      try {
        const publishInput = mapReviewedDraftToPublishRequest(storedDraft, questions)
        const result = await publishGeneratedTest(publishInput)
        clearGeneratedTestDraft()
        setSavedTestId(result.testId)
        toast.success(t("tests.publish.publishSuccess"))
        router.push(result.redirectTo)
        return
      } catch (error) {
        const message =
          error instanceof Error ? error.message : PUBLISH_GENERATED_TEST_ERROR_MESSAGE
        setPublishError(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
        toast.error(`${t("tests.publish.publishFailed")} ${message}`)
        setIsPublishing(false)
        return
      }
    }

    window.setTimeout(() => {
      setPublished(true)
      toast.success(t("tests.publish.publishSuccess"))
      setIsPublishing(false)
    }, 700)
  }

  if (published) {
    return (
      <div className="page-shell-narrow">
        <PublishSuccessState context={context} publishedTestId={publishedTestId} />
      </div>
    )
  }

  return (
    <div className="page-shell-narrow">
      <div className="mb-6 space-y-1">
        <h1 className="typography-h1">{t("tests.publish.title")}</h1>
        <p className="typography-p text-muted-foreground">{t("tests.publish.subtitle")}</p>
        <p className="typography-small text-muted-foreground">{t("tests.publish.sourceHint")}</p>
      </div>

      <Breadcrumbs
        className="mb-6"
        items={[
          { label: t("nav.tests"), href: "/admin/tests" },
          {
            label: t("tests.review.breadcrumbReview"),
            href: `/admin/tests/review?documentId=${encodeURIComponent(documentId)}`,
          },
          { label: t("tests.publish.title") },
        ]}
      />

      {draftSaved ? (
        <Card className="mb-2 border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/20">
          <CardContent className="py-3">
            <p className="typography-small text-emerald-800 dark:text-emerald-300">
              {t("tests.publish.draftSaved")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {publishError ? (
        <Card className="mb-2 border-destructive/30 bg-destructive/5">
          <CardContent className="py-3">
            <p className="typography-small text-destructive">{publishError}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <PublishTestSummary context={context} isReady={canPublish} />
          <PublishApprovedQuestions
            questions={questionsToPublish}
            rejectedCount={context.rejectedCount}
          />
        </div>

        <div className="space-y-2">
          <PublishReadinessCard checks={readinessChecks} blockReason={blockReason} />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <Button
                type="button"
                className="w-full bg-foreground text-background"
                disabled={!canPublish || isPublishing || !isHydrated}
                onClick={handlePublish}
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 size-4" />
                )}
                {isPublishing
                  ? isAiDraft
                    ? t("tests.publish.savingGeneratedTest")
                    : t("tests.publish.publishing")
                  : t("tests.publish.publishTest")}
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href={`/admin/tests/review?documentId=${encodeURIComponent(documentId)}`}>
                  {t("tests.publish.backToReview")}
                </Link>
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleSaveDraft}>
                <Save className="mr-2 size-4" />
                {t("tests.publish.saveAsDraft")}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/admin/tests">{t("common.cancel")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
