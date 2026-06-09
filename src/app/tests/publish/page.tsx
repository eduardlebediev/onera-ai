import { mockDocuments } from "@/data/mock/documents"
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
    mockDocuments.find((document) => document.id === documentId) ?? defaultDocument
  const reviewData = getMockTestReviewData(sourceDocument)

  return <PublishTestPage document={sourceDocument} reviewData={reviewData} />
}
