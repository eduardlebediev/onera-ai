import { TestTakingNotFound } from "@/features/employee/tests/components/test-taking-not-found"
import { TestTakingPage } from "@/features/employee/tests/components/test-taking-page"
import { getEmployeeTakeableTestById } from "@/features/employee/tests/mock/employee-tests"
import { getSupabaseEmployeeTakeableTest } from "@/features/employee/tests/lib/supabase-employee-tests"
import { isUuid } from "@/features/documents/lib/demo-document-ids"

export const dynamic = "force-dynamic"

interface EmployeeTestTakeRouteProps {
  params: Promise<{ id: string }>
}

async function loadSupabaseTakeableTest(id: string) {
  try {
    return await getSupabaseEmployeeTakeableTest(id)
  } catch (error) {
    console.error("Failed to load Supabase takeable test:", error)
    return null
  }
}

export default async function EmployeeTestTakeRoute({ params }: EmployeeTestTakeRouteProps) {
  const { id } = await params

  if (isUuid(id)) {
    const test = await loadSupabaseTakeableTest(id)

    if (!test) {
      return <TestTakingNotFound />
    }

    return <TestTakingPage test={{ ...test, source: "supabase" }} />
  }

  const test = getEmployeeTakeableTestById(id)

  if (!test) {
    return <TestTakingNotFound />
  }

  return <TestTakingPage test={test} />
}
