import { EmployeeTestsPage } from "@/features/employee/tests/components/employee-tests-page"
import {
  getCurrentEmployee,
  getEmployeeAssignedTests,
} from "@/features/employee/tests/mock/employee-tests"

export default function EmployeeTestsRoute() {
  const employee = getCurrentEmployee()
  const tests = getEmployeeAssignedTests()

  return <EmployeeTestsPage employee={employee} tests={tests} />
}
