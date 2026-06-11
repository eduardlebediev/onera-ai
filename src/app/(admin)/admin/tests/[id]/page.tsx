import { notFound } from "next/navigation"

import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { SavedTestDetailPage } from "@/features/tests/components/saved-test-detail-page"
import { TestDetailPage } from "@/features/tests/components/test-detail-page"
import { getSupabaseAssignmentSummaryByTestId } from "@/features/tests/lib/supabase-assignments"
import { getSavedTestDetailById } from "@/features/tests/lib/supabase-test-detail"
import { getResolvedMockTestById } from "@/features/tests/lib/test-source-document"
import { mockTests } from "@/features/tests/mock/tests"

interface TestDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function TestDetailRoute({ params }: TestDetailRouteProps) {
  const { id } = await params
  const mockTest = getResolvedMockTestById(mockTests, id)

  if (mockTest) {
    return <TestDetailPage test={mockTest} />
  }

  if (!isUuid(id)) {
    notFound()
  }

  let savedTest = null

  try {
    savedTest = await getSavedTestDetailById(id)
  } catch (error) {
    console.error(`Failed to load saved test ${id} from Supabase:`, error)
    notFound()
  }

  if (!savedTest) {
    notFound()
  }

  const assignments = await getSupabaseAssignmentSummaryByTestId(savedTest.id)

  return (
    <SavedTestDetailPage
      test={savedTest}
      assignmentSummary={assignments.summary}
      assignedEmployees={assignments.employees}
    />
  )
}
