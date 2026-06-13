import { mockDocuments } from "@/data/mock/documents"
import {
  resolveApiDocumentId,
  resolveMockDocumentByRouteId,
  resolveReviewDocumentRouteId,
} from "@/features/documents/lib/demo-document-ids"
import { PublishTestPage } from "@/features/tests/components/publish-test-page"
import { getLatestReviewDraftForDocument } from "@/features/tests/lib/supabase-review-drafts"
import { getMockTestReviewData } from "@/features/tests/mock/generated-test-review"

interface PublishTestRouteProps {
  searchParams: Promise<{ documentId?: string; runId?: string }>
}

export default async function PublishTestRoute({ searchParams }: PublishTestRouteProps) {
  const { documentId, runId } = await searchParams
  const defaultDocument =
    mockDocuments.find((document) => document.chunks.length > 0) ?? mockDocuments[0]
  const sourceDocument =
    (documentId ? resolveMockDocumentByRouteId(documentId) : undefined) ?? defaultDocument
  const reviewDocumentId = documentId ? resolveReviewDocumentRouteId(documentId) : sourceDocument.id
  const apiDocumentId = documentId ? resolveApiDocumentId(documentId) : null
  const supabaseReviewDraft = apiDocumentId
    ? await getLatestReviewDraftForDocument(apiDocumentId)
    : null
  const reviewData = supabaseReviewDraft?.reviewData ?? getMockTestReviewData(sourceDocument)

  return (
    <PublishTestPage
      document={sourceDocument}
      reviewData={reviewData}
      documentId={reviewDocumentId}
      generationRunId={supabaseReviewDraft?.generationRunId ?? runId ?? null}
      reviewDataSource={supabaseReviewDraft ? "supabase" : "mock"}
      recoveredDraft={supabaseReviewDraft?.storedDraft ?? null}
    />
  )
}
