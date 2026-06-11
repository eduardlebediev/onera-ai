import { EmployeeTestsPage } from "@/features/employee/tests/components/employee-tests-page"
import {
  getCurrentEmployee,
  getEmployeeAssignedTests,
} from "@/features/employee/tests/mock/employee-tests"
import { getSupabaseEmployeeAssignments } from "@/features/employee/tests/lib/supabase-employee-assignments"

export const dynamic = "force-dynamic"

export default async function EmployeeTestsRoute() {
  let employee = getCurrentEmployee()
  let tests = getEmployeeAssignedTests()

  try {
    const result = await getSupabaseEmployeeAssignments()

    if (result.tests.length > 0) {
      employee = result.employee ?? employee
      tests = result.tests
    }
  } catch (error) {
    console.error("Failed to load employee tests from Supabase:", error)
  }

  return <EmployeeTestsPage employee={employee} tests={tests} />
}
