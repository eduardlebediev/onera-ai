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

  const readinessChecks = useMemo(() => getPublishReadinessChecks(context), [context])
  const canPublish = useMemo(() => isPublishReady(readinessChecks), [readinessChecks])
  const blockReason = useMemo(
    () => (canPublish ? undefined : getPublishBlockReason(readinessChecks)),
    [canPublish, readinessChecks]
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
    toast.success("Draft saved.")
  }

  const handlePublish = async () => {
    if (!canPublish || isPublishing || !isHydrated) return

    setPublishError(null)
    setIsPublishing(true)

    if (isAiDraft) {
      const storedDraft = loadGeneratedTestDraft() ?? recoveredDraft

      if (!storedDraft) {
        setPublishError(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
        toast.error(`Publish failed. ${PUBLISH_GENERATED_TEST_ERROR_MESSAGE}`)
        setIsPublishing(false)
        return
      }

      try {
        const publishInput = mapReviewedDraftToPublishRequest(storedDraft, questions)
        const result = await publishGeneratedTest(publishInput)
        clearGeneratedTestDraft()
        setSavedTestId(result.testId)
        toast.success("Test published successfully.")
        router.push(result.redirectTo)
        return
      } catch (error) {
        const message =
          error instanceof Error ? error.message : PUBLISH_GENERATED_TEST_ERROR_MESSAGE
        setPublishError(PUBLISH_GENERATED_TEST_ERROR_MESSAGE)
        toast.error(`Publish failed. ${message}`)
        setIsPublishing(false)
        return
      }
    }

    window.setTimeout(() => {
      setPublished(true)
      toast.success("Test published successfully.")
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
        <h1 className="typography-h1">Publish Test</h1>
        <p className="typography-p text-muted-foreground">
          Review the final test summary, confirm readiness, and publish when you are ready.
        </p>
        <p className="typography-small text-muted-foreground">
          This test was generated from selected document topics and source chunks.
        </p>
      </div>

      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Tests", href: "/admin/tests" },
          {
            label: "Review",
            href: `/admin/tests/review?documentId=${encodeURIComponent(documentId)}`,
          },
          { label: "Publish" },
        ]}
      />

      {draftSaved ? (
        <Card className="mb-2 border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/20">
          <CardContent className="py-3">
            <p className="typography-small text-emerald-800 dark:text-emerald-300">
              Draft saved locally. You can return to review or publish when ready.
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
                    ? "Saving generated test..."
                    : "Publishing..."
                  : "Publish Test"}
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href={`/admin/tests/review?documentId=${encodeURIComponent(documentId)}`}>
                  Back to Review
                </Link>
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleSaveDraft}>
                <Save className="mr-2 size-4" />
                Save as Draft
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/admin/tests">Cancel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
