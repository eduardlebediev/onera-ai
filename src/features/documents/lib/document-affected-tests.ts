import "server-only"

import { getTestIdsLinkedToDocument } from "@/features/tests/lib/test-documents"
import { createAdminClient } from "@/lib/supabase/admin"

export type AffectedDocumentVersionTest = {
  testId: string
  title: string
  status: string
  questionCount: number
}

type AffectedTestRow = {
  id: string
  title: string
  status: string
  question_count: number | null
}

export async function getAffectedTestsForDocumentVersion(input: {
  organizationId: string
  documentId: string
}): Promise<AffectedDocumentVersionTest[]> {
  const supabase = createAdminClient()
  const affectedTestIds = await getTestIdsLinkedToDocument(input.documentId)

  if (affectedTestIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("tests")
    .select("id, title, status, question_count")
    .eq("organization_id", input.organizationId)
    .in("id", affectedTestIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch affected tests: ${error.message}`)
  }

  return ((data ?? []) as AffectedTestRow[]).map((test) => ({
    testId: test.id,
    title: test.title,
    status: test.status,
    questionCount: test.question_count ?? 0,
  }))
}
