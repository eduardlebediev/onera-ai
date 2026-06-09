"use client"

import { Rocket, Save } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { PublishApprovedQuestions } from "@/features/tests/components/publish-approved-questions"
import { PublishReadinessCard } from "@/features/tests/components/publish-readiness-card"
import { PublishSuccessState } from "@/features/tests/components/publish-success-state"
import { PublishTestSummary } from "@/features/tests/components/publish-test-summary"
import {
  buildPublishContext,
  getApprovedQuestions,
  getPublishBlockReason,
  getPublishReadinessChecks,
  isPublishReady,
  resolvePublishedTestId,
  type PublishTestContext,
} from "@/features/tests/lib/publish-test-model"
import type { MockTestReviewData } from "@/features/tests/mock/generated-test-review"
import type { MockDocumentDetail } from "@/data/mock/documents"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface PublishTestPageProps {
  document: MockDocumentDetail
  reviewData: MockTestReviewData
}

export function PublishTestPage({ document, reviewData }: PublishTestPageProps) {
  const [published, setPublished] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

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
  const publishedTestId = useMemo(() => resolvePublishedTestId(document.id), [document.id])

  const handleSaveDraft = () => {
    setDraftSaved(true)
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
      </div>

      {draftSaved ? (
        <Card className="mb-2 border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/20">
          <CardContent className="py-3">
            <p className="typography-small text-emerald-800 dark:text-emerald-300">
              Draft saved locally. You can return to review or publish when ready.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <PublishTestSummary context={context} isReady={canPublish} />
          <PublishApprovedQuestions
            questions={approvedQuestions}
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
                disabled={!canPublish}
                onClick={() => setPublished(true)}
              >
                <Rocket className="mr-2 size-4" />
                Publish Test
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href={`/tests/review?documentId=${encodeURIComponent(document.id)}`}>
                  Back to Review
                </Link>
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleSaveDraft}>
                <Save className="mr-2 size-4" />
                Save as Draft
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/tests">Cancel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
