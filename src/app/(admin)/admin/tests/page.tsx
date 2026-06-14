import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { TestsListPage } from "@/features/tests/components/tests-list-page"
import { getTestsFromSupabase } from "@/features/tests/lib/supabase-tests"

export const dynamic = "force-dynamic"

export default async function TestsPage() {
  const user = await requireAdminUser()
  let tests: Awaited<ReturnType<typeof getTestsFromSupabase>>["tests"] = []
  let loadError = false

  try {
    const result = await getTestsFromSupabase(user.membership.organizationId)
    tests = result.tests
  } catch (error) {
    console.error("Failed to load tests from Supabase:", error)
    loadError = true
  }

  return <TestsListPage tests={tests} loadError={loadError} />
}
