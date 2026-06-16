import { notFound, redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/lib/current-user"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { EmployeeTestDetail } from "@/features/employee/tests/components/employee-test-detail"
import {
  getEmployeeTestFullPageHref,
  shouldLoadEmployeeTestResult,
} from "@/features/employee/tests/lib/employee-test-model"
import { getSupabaseEmployeeAssignments } from "@/features/employee/tests/lib/supabase-employee-assignments"

export const dynamic = "force-dynamic"

interface EmployeeTestDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeTestDetailRoute({ params }: EmployeeTestDetailRouteProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || !isUuid(id)) {
    notFound()
  }

  let tests: Awaited<ReturnType<typeof getSupabaseEmployeeAssignments>>["tests"] = []

  try {
    const result = await getSupabaseEmployeeAssignments(user.userId, user.membership.organizationId)
    tests = result.tests
  } catch (error) {
    console.error(`Failed to load employee test ${id} from Supabase:`, error)
    notFound()
  }

  const test = tests.find((item) => item.id === id)

  if (!test) {
    notFound()
  }

  if (shouldLoadEmployeeTestResult(test)) {
    redirect(getEmployeeTestFullPageHref(test))
  }

  return (
    <div className="page-shell">
      <EmployeeTestDetail test={test} />
    </div>
  )
}
