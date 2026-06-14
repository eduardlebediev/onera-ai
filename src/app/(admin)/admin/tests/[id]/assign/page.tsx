import { notFound } from "next/navigation"

import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { AssignEmployeesPage } from "@/features/tests/components/assign-employees-page"
import { AssignNotPublished } from "@/features/tests/components/assign-not-published"
import { getSupabaseAssignPageData } from "@/features/tests/lib/supabase-assignments"
import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"

interface AssignTestRouteProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function AssignTestRoute({ params }: AssignTestRouteProps) {
  const { id } = await params

  if (!isUuid(id)) {
    notFound()
  }

  const user = await requireAdminUser()
  const data = await getSupabaseAssignPageData(id, user.membership.organizationId)

  if (!data) {
    notFound()
  }

  if (data.test.status !== "published") {
    return <AssignNotPublished test={data.test} />
  }

  if (
    !isTestAssignable({
      status: data.test.status,
      isActive: data.test.isActive ?? true,
      sourceValidity: data.test.sourceValidity ?? "valid",
    })
  ) {
    return <AssignNotPublished test={data.test} inactive />
  }

  return (
    <AssignEmployeesPage
      test={data.test}
      employees={data.employees}
      initialAssignments={data.assignments}
      source="supabase"
    />
  )
}
