import { EmployeeTestResultLoader } from "@/features/employee/tests/components/employee-test-result-loader"
import { TestResultNotFound } from "@/features/employee/tests/components/test-result-not-found"
import { TestResultPage } from "@/features/employee/tests/components/test-result-page"
import { getPersistedEmployeeTestResult } from "@/features/employee/tests/lib/supabase-employee-attempts"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import { isUuid } from "@/features/documents/lib/demo-document-ids"

export const dynamic = "force-dynamic"

interface EmployeeTestResultRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attemptId?: string }>
}

async function loadPersistedResult(
  testId: string,
  attemptId: string
): Promise<EmployeeTestResult | null> {
  try {
    return await getPersistedEmployeeTestResult(testId, attemptId)
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

  if (isUuid(id) && attemptId) {
    const result = await loadPersistedResult(id, attemptId)

    if (result) {
      return <TestResultPage result={result} />
    }

    return <TestResultNotFound />
  }

  return <EmployeeTestResultLoader testId={id} />
}
