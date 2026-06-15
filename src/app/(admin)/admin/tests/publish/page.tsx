import Link from "next/link"

import {
  resolveApiDocumentId,
  resolveReviewDocumentRouteId,
} from "@/features/documents/lib/demo-document-ids"
import { getDocumentDetailById } from "@/features/documents/lib/supabase-documents"
import { PublishTestPage } from "@/features/tests/components/publish-test-page"
import { getLatestReviewDraftForDocument } from "@/features/tests/lib/supabase-review-drafts"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface PublishTestRouteProps {
  searchParams: Promise<{ documentId?: string; runId?: string }>
}

function EmptyPublishState() {
  return (
    <div className="page-shell-narrow">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Tests", href: "/admin/tests" },
          { label: "Review", href: "/admin/tests/review" },
          { label: "Publish" },
        ]}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div>
            <p className="typography-h3 font-semibold">No approved review draft found</p>
            <p className="mt-2 max-w-md typography-p text-muted-foreground">
              Generate and review a test draft before publishing it.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/documents">Generate Test</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function PublishTestRoute({ searchParams }: PublishTestRouteProps) {
  const { documentId, runId } = await searchParams
  const apiDocumentId = documentId ? resolveApiDocumentId(documentId) : null

  if (!documentId || !apiDocumentId) {
    return <EmptyPublishState />
  }

  const supabaseReviewDraft = apiDocumentId
    ? await getLatestReviewDraftForDocument(apiDocumentId)
    : null
  const sourceDocument = await getDocumentDetailById(apiDocumentId)

  if (!supabaseReviewDraft || !sourceDocument) {
    return <EmptyPublishState />
  }

  return (
    <PublishTestPage
      document={sourceDocument}
      reviewData={supabaseReviewDraft.reviewData}
      documentId={resolveReviewDocumentRouteId(documentId)}
      generationRunId={supabaseReviewDraft.generationRunId ?? runId ?? null}
      reviewDataSource="supabase"
      recoveredDraft={supabaseReviewDraft.storedDraft}
    />
  )
}
