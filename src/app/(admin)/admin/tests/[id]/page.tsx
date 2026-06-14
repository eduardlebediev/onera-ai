import { notFound } from "next/navigation"

import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { SavedTestDetailPage } from "@/features/tests/components/saved-test-detail-page"
import { TestDetailPage } from "@/features/tests/components/test-detail-page"
import { getSupabaseAssignmentSummaryByTestId } from "@/features/tests/lib/supabase-assignments"
import { getSavedTestDetailById } from "@/features/tests/lib/supabase-test-detail"
import { getSupabaseTestProgress } from "@/features/tests/lib/supabase-test-progress"
import { getTestLifecycleImpact } from "@/features/tests/lib/test-lifecycle"
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

  const user = await requireAdminUser()
  const organizationId = user.membership.organizationId

  let savedTest = null

  try {
    savedTest = await getSavedTestDetailById(id, organizationId)
  } catch (error) {
    console.error(`Failed to load saved test ${id} from Supabase:`, error)
    notFound()
  }

  if (!savedTest) {
    notFound()
  }

  const [assignments, progress, lifecycleImpact] = await Promise.all([
    getSupabaseAssignmentSummaryByTestId(savedTest.id, organizationId),
    getSupabaseTestProgress(savedTest.id, organizationId).catch((error) => {
      console.error(`Failed to load test progress for ${savedTest.id}:`, error)
      return null
    }),
    getTestLifecycleImpact({ testId: savedTest.id, organizationId }),
  ])

  const assignedEmployees =
    progress?.employees ??
    assignments.employees.map((employee) => ({
      assignmentId: employee.assignmentId,
      userId: employee.userId,
      name: employee.name,
      email: employee.email,
      assignmentStatus: employee.status,
      deadline: employee.deadline,
      attemptStatus: null,
      score: null,
      passed: null,
      completedAt: null,
      resultLabel: "—",
    }))

  return (
    <SavedTestDetailPage
      test={savedTest}
      assignmentSummary={assignments.summary}
      assignedEmployees={assignedEmployees}
      results={progress?.results}
      lifecycleImpact={lifecycleImpact}
    />
  )
}
