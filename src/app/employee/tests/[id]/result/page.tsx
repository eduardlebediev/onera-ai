import { TestResultNotFound } from "@/features/employee/tests/components/test-result-not-found"
import { TestResultPage } from "@/features/employee/tests/components/test-result-page"
import { getEmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"

interface EmployeeTestResultRouteProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeTestResultRoute({ params }: EmployeeTestResultRouteProps) {
  const { id } = await params
  const result = getEmployeeTestResult(id)

  if (!result) {
    return <TestResultNotFound />
  }

  return <TestResultPage result={result} />
}
