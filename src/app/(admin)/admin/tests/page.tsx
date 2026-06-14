import { BackendFallbackBanner } from "@/features/documents/components/backend-fallback-banner"
import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { TestsListPage } from "@/features/tests/components/tests-list-page"
import { resolveMockTest } from "@/features/tests/lib/test-source-document"
import { getTestsFromSupabase } from "@/features/tests/lib/supabase-tests"
import { mockTests } from "@/features/tests/mock/tests"

export const dynamic = "force-dynamic"

export default async function TestsPage() {
  const user = await requireAdminUser()
  let tests = mockTests.map(resolveMockTest)
  let showFallbackBanner = false

  try {
    const result = await getTestsFromSupabase(user.membership.organizationId)

    if (result.tests.length > 0) {
      tests = result.tests
    } else {
      showFallbackBanner = true
    }
  } catch (error) {
    console.error("Failed to load tests from Supabase:", error)
    showFallbackBanner = true
  }

  return (
    <TestsListPage
      tests={tests}
      banner={showFallbackBanner ? <BackendFallbackBanner /> : undefined}
    />
  )
}
