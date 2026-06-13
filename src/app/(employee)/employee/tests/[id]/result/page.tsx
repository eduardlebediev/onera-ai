import { getCurrentUser } from "@/features/auth/lib/current-user"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { EmployeeTestResultLoader } from "@/features/employee/tests/components/employee-test-result-loader"
import { TestResultNotFound } from "@/features/employee/tests/components/test-result-not-found"
import { TestResultPage } from "@/features/employee/tests/components/test-result-page"
import { getPersistedEmployeeTestResult } from "@/features/employee/tests/lib/supabase-employee-attempts"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"

export const dynamic = "force-dynamic"

interface EmployeeTestResultRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attemptId?: string }>
}

async function loadPersistedResult(
  testId: string,
  attemptId: string,
  userId: string,
  organizationId: string
): Promise<EmployeeTestResult | null> {
  try {
    return await getPersistedEmployeeTestResult(testId, attemptId, userId, organizationId)
  } catch (error) {
    console.error("Failed to load persisted test result:", error)
    return null
  }
}

export default async function EmployeeTestResultRoute({
  params,
  searchParams,
}: EmployeeTestResultRouteProps) {
  const { id } = await params
  const { attemptId } = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    return <TestResultNotFound />
  }

  if (!isUuid(id)) {
    return <EmployeeTestResultLoader testId={id} />
  }

  if (!attemptId) {
    return <TestResultNotFound />
  }

  const result = await loadPersistedResult(
    id,
    attemptId,
    user.userId,
    user.membership.organizationId
  )

  if (!result) {
    return <TestResultNotFound />
  }

  return <TestResultPage result={result} />
}
