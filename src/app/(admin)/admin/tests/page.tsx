import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { TestsListPage } from "@/features/tests/components/tests-list-page"
import { getNewTestRoute } from "@/features/tests/lib/new-test-route"
import { getTestsFromSupabase } from "@/features/tests/lib/supabase-tests"

export const dynamic = "force-dynamic"

export default async function TestsPage() {
  const user = await requireAdminUser()
  let tests: Awaited<ReturnType<typeof getTestsFromSupabase>>["tests"] = []
  let loadError = false
  let newTestHref = "/admin/documents"

  try {
    const result = await getTestsFromSupabase(user.membership.organizationId)
    tests = result.tests
  } catch (error) {
    console.error("Failed to load tests from Supabase:", error)
    loadError = true
  }

  try {
    newTestHref = await getNewTestRoute(user.membership.organizationId)
  } catch (error) {
    console.error("Failed to resolve new test route:", error)
  }

  return <TestsListPage tests={tests} loadError={loadError} newTestHref={newTestHref} />
}
