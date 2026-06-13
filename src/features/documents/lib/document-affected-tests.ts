import "server-only"

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

  const { data, error } = await supabase
    .from("tests")
    .select("id, title, status, question_count")
    .eq("organization_id", input.organizationId)
    .eq("source_document_id", input.documentId)
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
