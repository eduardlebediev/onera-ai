import { getCurrentUser } from "@/features/auth/lib/current-user"
import { EmployeeDashboard } from "@/features/employee/tests/components/employee-dashboard"
import {
  getSupabaseEmployeeAssignments,
  type SupabaseEmployeeAssignmentsResult,
} from "@/features/employee/tests/lib/supabase-employee-assignments"
import type { MockEmployee } from "@/features/tests/mock/employees"

export const dynamic = "force-dynamic"

function buildEmployeeFallback(user: {
  userId: string
  email: string
  profile: { fullName: string | null }
}): MockEmployee {
  return {
    id: user.userId,
    name: user.profile.fullName ?? user.email,
    email: user.email,
    role: "Employee",
    department: "Unassigned",
    completedTestsCount: 0,
    averageScore: 0,
    riskLevel: "on_track",
  }
}

async function loadEmployeeDashboardData(
  userId: string,
  organizationId: string
): Promise<SupabaseEmployeeAssignmentsResult | null> {
  try {
    return await getSupabaseEmployeeAssignments(userId, organizationId)
  } catch (error) {
    console.error("Failed to load employee dashboard assignments from Supabase:", error)
    return null
  }
}

export default async function EmployeeDashboardRoute() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const result = await loadEmployeeDashboardData(user.userId, user.membership.organizationId)

  return (
    <EmployeeDashboard
      employee={result?.employee ?? buildEmployeeFallback(user)}
      organizationId={user.membership.organizationId}
      tests={result?.tests ?? []}
      userId={user.userId}
    />
  )
}
