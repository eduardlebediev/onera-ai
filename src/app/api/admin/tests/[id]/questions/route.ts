import { NextResponse } from "next/server"

import { getDraftTestForReview } from "@/features/tests/lib/draft-test"
import { PatchReviewQuestionsRequestSchema } from "@/features/tests/schemas/review-question-schema"
import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

interface PatchQuestionsRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(request: Request, { params }: PatchQuestionsRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id: testId } = await params
    const organizationId = admin.membership.organizationId

    const draft = await getDraftTestForReview(testId, organizationId)
    if (!draft) {
      return jsonError("Draft test not found", 404)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = PatchReviewQuestionsRequestSchema.safeParse(body)
    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const { upsert = [], deleteIds = [] } = parsedRequest.data
    const supabase = createAdminClient()

    if (deleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("test_questions")
        .delete()
        .eq("test_id", testId)
        .eq("organization_id", organizationId)
        .in("id", deleteIds)

      if (deleteError) {
        return jsonError("Failed to delete questions", 500)
      }
    }

    const upsertResults: Array<{ clientId?: string; id: string }> = []

    for (const question of upsert) {
      const sourceStatus = question.isAiGenerated ? "valid" : "manual_kept"
      const reviewStatus =
        question.reviewStatus === "needs_review" ? "pending" : question.reviewStatus

      const row = {
        organization_id: organizationId,
        test_id: testId,
        question_text: question.questionText,
        question_type: question.questionType,
        options: question.options as unknown as Json,
        correct_answer: question.correctAnswer as unknown as Json,
        explanation: question.explanation,
        topic: question.topic,
        difficulty: question.difficulty,
        order_index: question.orderIndex ?? 0,
        source_chunk_id: question.sourceChunkId ?? null,
        source_document_id: question.sourceDocumentId ?? null,
        source_status: sourceStatus,
        review_status: reviewStatus,
        is_active: true,
      }

      if (question.id) {
        const { data, error } = await supabase
          .from("test_questions")
          .update(row)
          .eq("id", question.id)
          .eq("test_id", testId)
          .eq("organization_id", organizationId)
          .select("id")
          .maybeSingle()

        if (error || !data) {
          return jsonError("Failed to update question", 500)
        }

        upsertResults.push({ clientId: question.clientId, id: data.id })
        continue
      }

      const { data, error } = await supabase
        .from("test_questions")
        .insert(row)
        .select("id")
        .single()

      if (error || !data) {
        return jsonError("Failed to create question", 500)
      }

      upsertResults.push({ clientId: question.clientId, id: data.id })
    }

    if (upsert.length > 0 || deleteIds.length > 0) {
      const { data: remainingQuestions, error: countError } = await supabase
        .from("test_questions")
        .select("id, review_status")
        .eq("test_id", testId)
        .eq("organization_id", organizationId)

      if (countError) {
        return jsonError("Failed to recount draft questions", 500)
      }

      const approvedCount =
        remainingQuestions?.filter(
          (question) => question.review_status === "approved" || question.review_status === "edited"
        ).length ?? 0

      if (approvedCount === 0 && remainingQuestions && remainingQuestions.length > 0) {
        // Allowed: draft can temporarily have zero approved questions; publish will block.
      }

      await supabase
        .from("tests")
        .update({ question_count: remainingQuestions?.length ?? 0 })
        .eq("id", testId)
        .eq("organization_id", organizationId)
    }

    return NextResponse.json({ upserted: upsertResults, deletedIds: deleteIds })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Patch review questions API error:", error)
    return jsonError("Internal server error", 500)
  }
}
