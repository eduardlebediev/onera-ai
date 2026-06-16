import "server-only"

import { z } from "zod"

import type { DocumentStatus } from "@/features/documents/types/document"
import { mapStoredDraftToReviewData } from "@/features/tests/lib/generated-test-mapper"
import { getDraftTestForReview } from "@/features/tests/lib/draft-test"
import {
  GeneratedTestResponseSchema,
  type StoredGeneratedTestDraftValidated,
} from "@/features/tests/schemas/generated-test-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

type GenerationRunRow = {
  id: string
  document_id: string | null
  test_id: string | null
  status: string
  output_summary: Json
  created_at: string
}

type DocumentRow = {
  id: string
  title: string
  status: string
  organization_id: string
}

export type SupabaseReviewDraft = {
  reviewData: ReturnType<typeof mapStoredDraftToReviewData>
  sourceDocumentTitle: string
  sourceDocumentStatus: DocumentStatus
  generationRunId: string
  testId: string | null
  storedDraft: StoredGeneratedTestDraftValidated
}

const ReviewDraftPayloadSchema = GeneratedTestResponseSchema.omit({
  generationRunId: true,
})

const GenerationOutputSummarySchema = z
  .object({
    review_draft: ReviewDraftPayloadSchema.optional(),
  })
  .passthrough()

function normalizeDocumentStatus(status: string | null | undefined): DocumentStatus {
  if (
    status === "ready" ||
    status === "processing" ||
    status === "failed" ||
    status === "uploaded" ||
    status === "archived" ||
    status === "deleted"
  ) {
    return status
  }

  return "ready"
}

export async function getLatestGenerationRunForDocument(
  documentId: string
): Promise<GenerationRunRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ai_generation_runs")
    .select("id, document_id, test_id, status, output_summary, created_at")
    .eq("document_id", documentId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch latest generation run: ${error.message}`)
  }

  return data as GenerationRunRow | null
}

async function getDocumentRow(documentId: string): Promise<DocumentRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, status, organization_id")
    .eq("id", documentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch review source document: ${error.message}`)
  }

  return data as DocumentRow | null
}

export async function getLatestReviewDraftForDocument(
  documentId: string
): Promise<SupabaseReviewDraft | null> {
  try {
    const generationRun = await getLatestGenerationRunForDocument(documentId)

    if (!generationRun || generationRun.status !== "completed") {
      return null
    }

    const parsedOutput = GenerationOutputSummarySchema.safeParse(generationRun.output_summary)
    const reviewDraft = parsedOutput.success ? parsedOutput.data.review_draft : undefined

    if (!reviewDraft || reviewDraft.draft.questions.length === 0) {
      return null
    }

    const storedDraft: StoredGeneratedTestDraftValidated = {
      generationRunId: generationRun.id,
      ...reviewDraft,
      createdAt: generationRun.created_at,
    }
    const documentRow = await getDocumentRow(documentId)
    const primaryDocument = reviewDraft.documents.find((document) => document.id === documentId)

    let reviewQuestions = mapStoredDraftToReviewData(storedDraft).questions
    let reviewData = mapStoredDraftToReviewData(storedDraft)

    if (generationRun.test_id && documentRow) {
      const draftFromDb = await getDraftTestForReview(
        generationRun.test_id,
        documentRow.organization_id
      )
      if (draftFromDb && draftFromDb.questions.length > 0) {
        reviewQuestions = draftFromDb.questions
        reviewData = {
          ...reviewData,
          questions: reviewQuestions,
          questionCount: reviewQuestions.length,
        }
      }
    }

    return {
      reviewData,
      sourceDocumentTitle: documentRow?.title ?? primaryDocument?.title ?? "Source document",
      sourceDocumentStatus: normalizeDocumentStatus(documentRow?.status),
      generationRunId: generationRun.id,
      testId: generationRun.test_id,
      storedDraft,
    }
  } catch (error) {
    console.warn("Could not load Supabase review draft:", error)
    return null
  }
}
