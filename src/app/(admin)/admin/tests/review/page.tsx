import { mockDocuments } from "@/data/mock/documents"
import {
  resolveMockDocumentByRouteId,
  resolveReviewDocumentRouteId,
} from "@/features/documents/lib/demo-document-ids"
import { TestReviewPage } from "@/features/tests/components/test-review-page"
import { getMockTestReviewData } from "@/features/tests/mock/generated-test-review"

interface TestReviewRouteProps {
  searchParams: Promise<{ documentId?: string; runId?: string; documentIds?: string }>
}

export default async function TestReviewRoute({ searchParams }: TestReviewRouteProps) {
  const { documentId, runId } = await searchParams
  const defaultDocument =
    mockDocuments.find((document) => document.chunks.length > 0) ?? mockDocuments[0]
  const sourceDocument =
    (documentId ? resolveMockDocumentByRouteId(documentId) : undefined) ?? defaultDocument
  const reviewDocumentId = documentId ? resolveReviewDocumentRouteId(documentId) : sourceDocument.id
  const reviewData = getMockTestReviewData(sourceDocument)

  return (
    <TestReviewPage
      sourceDocumentTitle={sourceDocument.title}
      sourceDocumentStatus={sourceDocument.status}
      reviewData={reviewData}
      documentId={reviewDocumentId}
      generationRunId={runId ?? null}
    />
  )
}
