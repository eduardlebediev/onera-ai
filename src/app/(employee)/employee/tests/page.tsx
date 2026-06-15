import { getCurrentUser } from "@/features/auth/lib/current-user"
import { EmployeeTestsPage } from "@/features/employee/tests/components/employee-tests-page"
import {
  getSupabaseEmployeeAssignments,
  type SupabaseEmployeeAssignmentsResult,
} from "@/features/employee/tests/lib/supabase-employee-assignments"

export const dynamic = "force-dynamic"

async function loadEmployeeTestsData(
  userId: string,
  organizationId: string
): Promise<SupabaseEmployeeAssignmentsResult | null> {
  try {
    return await getSupabaseEmployeeAssignments(userId, organizationId)
  } catch (error) {
    console.error("Failed to load employee tests from Supabase:", error)
    return null
  }
}

export default async function EmployeeTestsRoute() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const result = await loadEmployeeTestsData(user.userId, user.membership.organizationId)

  return <EmployeeTestsPage tests={result?.tests ?? []} />
}
