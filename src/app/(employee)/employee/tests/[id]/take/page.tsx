import { getCurrentUser } from "@/features/auth/lib/current-user"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { TestTakingNotFound } from "@/features/employee/tests/components/test-taking-not-found"
import { TestTakingPage } from "@/features/employee/tests/components/test-taking-page"
import { getSupabaseEmployeeTakeableTest } from "@/features/employee/tests/lib/supabase-employee-tests"
import type { SupabaseEmployeeTakeableTest } from "@/features/employee/tests/lib/test-taking-state"

export const dynamic = "force-dynamic"

interface EmployeeTestTakeRouteProps {
  params: Promise<{ id: string }>
}

async function loadSupabaseTakeableTest(
  testId: string,
  userId: string,
  organizationId: string
): Promise<SupabaseEmployeeTakeableTest | null> {
  try {
    return await getSupabaseEmployeeTakeableTest(testId, userId, organizationId)
  } catch (error) {
    console.error("Failed to load Supabase takeable test:", error)
    return null
  }
}

export default async function EmployeeTestTakeRoute({ params }: EmployeeTestTakeRouteProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || !isUuid(id)) {
    return <TestTakingNotFound />
  }

  const test = await loadSupabaseTakeableTest(id, user.userId, user.membership.organizationId)

  if (!test) {
    return <TestTakingNotFound />
  }

  return <TestTakingPage test={{ ...test, source: "supabase" }} />
}
