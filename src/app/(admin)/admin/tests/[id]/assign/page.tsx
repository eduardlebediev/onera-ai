import { notFound } from "next/navigation"

import { AssignEmployeesPage } from "@/features/tests/components/assign-employees-page"
import { AssignNotPublished } from "@/features/tests/components/assign-not-published"
import { getResolvedMockTestById } from "@/features/tests/lib/test-source-document"
import { mockTests } from "@/features/tests/mock/tests"

interface AssignTestRouteProps {
  params: Promise<{ id: string }>
}

export default async function AssignTestRoute({ params }: AssignTestRouteProps) {
  const { id } = await params
  const test = getResolvedMockTestById(mockTests, id)

  if (!test) {
    notFound()
  }

  if (test.status !== "published") {
    return <AssignNotPublished test={test} />
  }

  return <AssignEmployeesPage test={test} />
}
