import { NextResponse } from "next/server"

import { insertTestDocuments } from "@/features/tests/lib/test-documents"
import {
  SourceDocumentValidationError,
  validateSelectableDocumentsForGeneration,
  validateSourceChunkIdsForDocuments,
} from "@/features/tests/lib/source-document-validation"
import {
  normalizePublishDocumentIds,
  PublishGeneratedTestRequestSchema,
  type PublishGeneratedQuestion,
} from "@/features/tests/schemas/publish-generated-test-schema"
import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function filterSaveableQuestions(
  questions: PublishGeneratedQuestion[]
): PublishGeneratedQuestion[] {
  return questions.filter((question) => question.reviewStatus !== "rejected")
}

function hasExactSameIds(left: string[], right: string[]): boolean {
  const leftIds = new Set(left)
  const rightIds = new Set(right)

  if (leftIds.size !== rightIds.size) {
    return false
  }

  for (const id of leftIds) {
    if (!rightIds.has(id)) {
      return false
    }
  }

  return true
}

async function fetchValidatedGenerationRun(
  generationRunId: string,
  documentIds: string[],
  organizationId: string
): Promise<{ output_summary: Json } | null> {
  const supabase = createAdminClient()

  const { data: generationRun, error } = await supabase
    .from("ai_generation_runs")
    .select("output_summary, input_config")
    .eq("id", generationRunId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to validate generation run: ${error.message}`)
  }

  if (!generationRun) {
    return null
  }

  const inputConfig =
    generationRun.input_config &&
    typeof generationRun.input_config === "object" &&
    !Array.isArray(generationRun.input_config)
      ? (generationRun.input_config as Record<string, Json | undefined>)
      : {}

  const runDocumentIds = Array.isArray(inputConfig.documentIds)
    ? inputConfig.documentIds.filter((value): value is string => typeof value === "string")
    : []

  if (runDocumentIds.length > 0 && !hasExactSameIds(documentIds, runDocumentIds)) {
    return null
  }

  return generationRun
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiUser()

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = PublishGeneratedTestRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const input = parsedRequest.data
    const documentIds = normalizePublishDocumentIds(input)
    const saveableQuestions = filterSaveableQuestions(input.questions)

    if (saveableQuestions.length === 0) {
      return jsonError("At least one approved question is required", 400)
    }

    let validatedDocuments

    try {
      validatedDocuments = await validateSelectableDocumentsForGeneration({
        organizationId: admin.membership.organizationId,
        documentIds,
      })
    } catch (error) {
      if (error instanceof SourceDocumentValidationError) {
        return jsonError(error.message, 400)
      }

      throw error
    }

    const primaryDocument = validatedDocuments.documents[0]

    if (!primaryDocument) {
      return jsonError("Primary source document not found", 404)
    }

    let chunkDocumentById: Map<string, string>

    try {
      chunkDocumentById = await validateSourceChunkIdsForDocuments({
        organizationId: admin.membership.organizationId,
        documentIds: validatedDocuments.documentIds,
        chunkIds: saveableQuestions
          .map((question) => question.sourceChunkId)
          .filter((chunkId): chunkId is string => Boolean(chunkId)),
      })
    } catch (error) {
      if (error instanceof SourceDocumentValidationError) {
        return jsonError(error.message, 422)
      }

      throw error
    }

    let generationRunSummary: Json | null = null

    if (input.generationRunId) {
      const generationRun = await fetchValidatedGenerationRun(
        input.generationRunId,
        validatedDocuments.documentIds,
        admin.membership.organizationId
      )

      if (!generationRun) {
        return jsonError("Invalid generation run for selected documents", 422)
      }

      generationRunSummary = generationRun.output_summary
    }

    const supabase = createAdminClient()
    const publishedAt = new Date().toISOString()

    const { data: savedTest, error: insertTestError } = await supabase
      .from("tests")
      .insert({
        organization_id: primaryDocument.organizationId,
        source_document_id: primaryDocument.id,
        title: input.title,
        description: input.description ?? null,
        status: "published",
        difficulty: input.difficulty,
        language: input.language,
        target_role: input.targetRole ?? null,
        question_count: saveableQuestions.length,
        passing_score: input.passingScore,
        created_by: null,
        published_at: publishedAt,
        is_active: true,
        source_validity: "valid",
      })
      .select("id")
      .single()

    if (insertTestError || !savedTest) {
      console.error("Failed to insert test:", insertTestError?.message)
      return jsonError("Failed to save generated test", 500)
    }

    try {
      await insertTestDocuments({
        testId: savedTest.id,
        organizationId: primaryDocument.organizationId,
        documentIds: validatedDocuments.documentIds,
      })
    } catch (error) {
      console.error("Failed to insert test_documents:", error)
      return jsonError(
        error instanceof Error ? error.message : "Failed to save test source documents",
        500
      )
    }

    const questionRows = saveableQuestions.map((question, index) => ({
      organization_id: primaryDocument.organizationId,
      test_id: savedTest.id,
      source_chunk_id: question.sourceChunkId ?? null,
      source_document_id: question.sourceChunkId
        ? (chunkDocumentById.get(question.sourceChunkId) ?? null)
        : null,
      is_active: true,
      source_status: "valid",
      question_text: question.questionText,
      question_type: question.questionType,
      options: question.options as unknown as Json,
      correct_answer: question.correctAnswer as unknown as Json,
      explanation: question.explanation,
      topic: question.topic ?? null,
      difficulty: question.difficulty ?? null,
      order_index: index,
    }))

    const { error: insertQuestionsError } = await supabase
      .from("test_questions")
      .insert(questionRows)

    if (insertQuestionsError) {
      console.error("Failed to insert test questions:", insertQuestionsError.message)
      return jsonError("Failed to save generated test questions", 500)
    }

    if (input.generationRunId) {
      const existingSummary =
        generationRunSummary &&
        typeof generationRunSummary === "object" &&
        !Array.isArray(generationRunSummary)
          ? (generationRunSummary as Record<string, Json | undefined>)
          : {}

      const { error: updateRunError } = await supabase
        .from("ai_generation_runs")
        .update({
          test_id: savedTest.id,
          output_summary: {
            ...existingSummary,
            saved_test_id: savedTest.id,
            saved_question_count: saveableQuestions.length,
            published_at: publishedAt,
            document_ids: validatedDocuments.documentIds,
          } satisfies Json,
        })
        .eq("id", input.generationRunId)
        .eq("organization_id", admin.membership.organizationId)

      if (updateRunError) {
        console.warn("Failed to update ai_generation_runs.test_id:", updateRunError.message)
      }
    }

    return NextResponse.json({
      testId: savedTest.id,
      questionCount: saveableQuestions.length,
      redirectTo: `/admin/tests/${savedTest.id}`,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof SourceDocumentValidationError) {
      return jsonError(error.message, 400)
    }

    console.error("Publish generated test API error:", error)
    return jsonError("Internal server error", 500)
  }
}
