import { notFound } from "next/navigation"

import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { AssignEmployeesPage } from "@/features/tests/components/assign-employees-page"
import { AssignNotPublished } from "@/features/tests/components/assign-not-published"
import { getSupabaseAssignPageData } from "@/features/tests/lib/supabase-assignments"
import { getResolvedMockTestById } from "@/features/tests/lib/test-source-document"
import { mockTests } from "@/features/tests/mock/tests"

interface AssignTestRouteProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function AssignTestRoute({ params }: AssignTestRouteProps) {
  const { id } = await params
  const test = getResolvedMockTestById(mockTests, id)

  if (test) {
    if (test.status !== "published") {
      return <AssignNotPublished test={test} />
    }

    return <AssignEmployeesPage test={test} />
  }

  if (!isUuid(id)) {
    notFound()
  }

  const data = await getSupabaseAssignPageData(id)

  if (!data) {
    notFound()
  }

  if (data.test.status !== "published") {
    return <AssignNotPublished test={data.test} />
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
