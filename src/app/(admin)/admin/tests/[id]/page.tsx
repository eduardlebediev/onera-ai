import { notFound } from "next/navigation"

import { TestDetailPage } from "@/features/tests/components/test-detail-page"
import { getResolvedMockTestById } from "@/features/tests/lib/test-source-document"
import { mockTests } from "@/features/tests/mock/tests"

interface TestDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function TestDetailRoute({ params }: TestDetailRouteProps) {
  const { id } = await params
  const test = getResolvedMockTestById(mockTests, id)

  if (!test) {
    notFound()
  }

  return <TestDetailPage test={test} />
}
