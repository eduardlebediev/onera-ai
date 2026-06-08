import { TestTakingNotFound } from "@/features/employee/tests/components/test-taking-not-found"
import { TestTakingPage } from "@/features/employee/tests/components/test-taking-page"
import { getEmployeeTakeableTestById } from "@/features/employee/tests/mock/employee-tests"

interface EmployeeTestTakeRouteProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeTestTakeRoute({ params }: EmployeeTestTakeRouteProps) {
  const { id } = await params
  const test = getEmployeeTakeableTestById(id)

  if (!test) {
    return <TestTakingNotFound />
  }

  return <TestTakingPage test={test} />
}
