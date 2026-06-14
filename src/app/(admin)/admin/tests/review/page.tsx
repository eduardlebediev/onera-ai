import Link from "next/link"

import {
  resolveApiDocumentId,
  resolveReviewDocumentRouteId,
} from "@/features/documents/lib/demo-document-ids"
import { TestReviewPage } from "@/features/tests/components/test-review-page"
import { getLatestReviewDraftForDocument } from "@/features/tests/lib/supabase-review-drafts"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface TestReviewRouteProps {
  searchParams: Promise<{ documentId?: string; runId?: string; documentIds?: string }>
}

function EmptyReviewState() {
  return (
    <div className="page-shell-narrow">
      <Breadcrumbs
        className="mb-6"
        items={[{ label: "Tests", href: "/admin/tests" }, { label: "Review" }]}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div>
            <p className="typography-h3 font-semibold">No review draft found</p>
            <p className="mt-2 max-w-md typography-p text-muted-foreground">
              Generate a test from a ready document to review AI-created questions.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/admin/documents">Generate Test</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function TestReviewRoute({ searchParams }: TestReviewRouteProps) {
  const { documentId, runId } = await searchParams
  const apiDocumentId = documentId ? resolveApiDocumentId(documentId) : null

  if (!documentId || !apiDocumentId) {
    return <EmptyReviewState />
  }

  const supabaseReviewDraft = apiDocumentId
    ? await getLatestReviewDraftForDocument(apiDocumentId)
    : null

  if (!supabaseReviewDraft) {
    return <EmptyReviewState />
  }

  return (
    <TestReviewPage
      sourceDocumentTitle={supabaseReviewDraft.sourceDocumentTitle}
      sourceDocumentStatus={supabaseReviewDraft.sourceDocumentStatus}
      reviewData={supabaseReviewDraft.reviewData}
      documentId={resolveReviewDocumentRouteId(documentId)}
      generationRunId={supabaseReviewDraft.generationRunId ?? runId ?? null}
      draftTestId={supabaseReviewDraft.testId}
      reviewDataSource="supabase"
    />
  )
}
