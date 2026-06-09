import { EmployeeDashboard } from "@/features/employee/tests/components/employee-dashboard"
import {
  getCurrentEmployee,
  getEmployeeAssignedTests,
} from "@/features/employee/tests/mock/employee-tests"

export default function EmployeeDashboardRoute() {
  const employee = getCurrentEmployee()
  const tests = getEmployeeAssignedTests()

  return <EmployeeDashboard employee={employee} tests={tests} />
}
