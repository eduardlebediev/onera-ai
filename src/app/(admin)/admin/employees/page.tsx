import { EmployeeManagementPage } from "@/features/employees/components/employee-management-page"
import {
  getEmployeeManagementData,
  type EmployeeManagementData,
} from "@/features/employees/lib/supabase-employees"
import { requireAdminUser } from "@/features/auth/lib/require-auth"

export const dynamic = "force-dynamic"

export default async function EmployeesPage() {
  const user = await requireAdminUser()

  let data: EmployeeManagementData = {
    employees: [],
    metrics: {
      totalEmployees: 0,
      averageScore: null,
      pendingCount: 0,
      overdueCount: 0,
    },
    departments: [],
    tests: [],
  }
  let loadError = false

  try {
    data = await getEmployeeManagementData(user.membership.organizationId)
  } catch (error) {
    console.error("Failed to load employees from Supabase:", error)
    loadError = true
  }

  return <EmployeeManagementPage data={data} loadError={loadError} />
}
