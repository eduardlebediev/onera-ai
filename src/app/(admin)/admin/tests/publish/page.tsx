import { mockDocuments } from "@/data/mock/documents"
import {
  resolveMockDocumentByRouteId,
  resolveReviewDocumentRouteId,
} from "@/features/documents/lib/demo-document-ids"
import { PublishTestPage } from "@/features/tests/components/publish-test-page"
import { getMockTestReviewData } from "@/features/tests/mock/generated-test-review"

interface PublishTestRouteProps {
  searchParams: Promise<{ documentId?: string }>
}

export default async function PublishTestRoute({ searchParams }: PublishTestRouteProps) {
  const { documentId } = await searchParams
  const defaultDocument =
    mockDocuments.find((document) => document.chunks.length > 0) ?? mockDocuments[0]
  const sourceDocument =
    (documentId ? resolveMockDocumentByRouteId(documentId) : undefined) ?? defaultDocument
  const reviewDocumentId = documentId ? resolveReviewDocumentRouteId(documentId) : sourceDocument.id
  const reviewData = getMockTestReviewData(sourceDocument)

  return (
    <PublishTestPage
      document={sourceDocument}
      reviewData={reviewData}
      documentId={reviewDocumentId}
    />
  )
}
