import { EmployeeTestResultLoader } from "@/features/employee/tests/components/employee-test-result-loader"

interface EmployeeTestResultRouteProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeTestResultRoute({ params }: EmployeeTestResultRouteProps) {
  const { id } = await params

  return <EmployeeTestResultLoader testId={id} />
}
