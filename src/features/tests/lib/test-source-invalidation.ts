import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type SourceInvalidationMode = "archived" | "deleted"

const TEST_INVALIDATION: Record<
  SourceInvalidationMode,
  {
    sourceValidity: string
    sourceInvalidReason: string
    questionSourceStatus: string
    questionInvalidReason: string
    clearSourceChunkIds: boolean
  }
> = {
  archived: {
    sourceValidity: "source_archived",
    sourceInvalidReason: "Source document was archived",
    questionSourceStatus: "document_archived",
    questionInvalidReason: "Source document was archived",
    clearSourceChunkIds: false,
  },
  deleted: {
    sourceValidity: "source_deleted",
    sourceInvalidReason: "Source document was deleted",
    questionSourceStatus: "document_deleted",
    questionInvalidReason: "Source document was deleted",
    clearSourceChunkIds: true,
  },
}

export async function invalidateTestsForSourceDocument(input: {
  organizationId: string
  documentId: string
  mode: SourceInvalidationMode
}): Promise<void> {
  const supabase = createAdminClient()
  const config = TEST_INVALIDATION[input.mode]
  const now = new Date().toISOString()

  const { error: testsError } = await supabase
    .from("tests")
    .update({
      is_active: false,
      source_validity: config.sourceValidity,
      source_invalid_reason: config.sourceInvalidReason,
      source_invalid_at: now,
    })
    .eq("organization_id", input.organizationId)
    .eq("source_document_id", input.documentId)

  if (testsError) {
    throw new Error(`Failed to invalidate dependent tests: ${testsError.message}`)
  }

  const questionUpdate = config.clearSourceChunkIds
    ? {
        is_active: false,
        source_status: config.questionSourceStatus,
        source_invalid_reason: config.questionInvalidReason,
        source_chunk_id: null,
      }
    : {
        is_active: false,
        source_status: config.questionSourceStatus,
        source_invalid_reason: config.questionInvalidReason,
      }

  const { error: questionsError } = await supabase
    .from("test_questions")
    .update(questionUpdate)
    .eq("organization_id", input.organizationId)
    .eq("source_document_id", input.documentId)

  if (questionsError) {
    throw new Error(`Failed to invalidate dependent questions: ${questionsError.message}`)
  }
}
