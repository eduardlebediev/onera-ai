import { mockDocuments } from "@/data/mock/documents"
import { TestReviewPage } from "@/features/tests/components/test-review-page"
import { getMockTestReviewData } from "@/features/tests/mock/generated-test-review"

interface TestReviewRouteProps {
  searchParams: Promise<{ documentId?: string }>
}

export default async function TestReviewRoute({ searchParams }: TestReviewRouteProps) {
  const { documentId } = await searchParams
  const defaultDocument =
    mockDocuments.find((document) => document.chunks.length > 0) ?? mockDocuments[0]
  const sourceDocument =
    mockDocuments.find((document) => document.id === documentId) ?? defaultDocument
  const reviewData = getMockTestReviewData(sourceDocument)

  return (
    <TestReviewPage
      sourceDocumentTitle={sourceDocument.title}
      sourceDocumentStatus={sourceDocument.status}
      reviewData={reviewData}
      documentId={sourceDocument.id}
    />
  )
}
