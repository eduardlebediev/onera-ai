import { NextResponse } from "next/server"

import { fetchDocumentById } from "@/features/tests/lib/retrieve-document-context"
import {
  PublishGeneratedTestRequestSchema,
  type PublishGeneratedQuestion,
} from "@/features/tests/schemas/publish-generated-test-schema"
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

async function validateSourceChunkIds(
  documentId: string,
  organizationId: string,
  questions: PublishGeneratedQuestion[]
): Promise<string | null> {
  const chunkIds = [
    ...new Set(
      questions
        .map((question) => question.sourceChunkId)
        .filter((chunkId): chunkId is string => Boolean(chunkId))
    ),
  ]

  if (chunkIds.length === 0) {
    return null
  }

  const supabase = createAdminClient()

  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id")
    .eq("document_id", documentId)
    .eq("organization_id", organizationId)
    .in("id", chunkIds)

  if (error) {
    throw new Error(`Failed to validate source chunks: ${error.message}`)
  }

  const validChunkIds = new Set((chunks ?? []).map((chunk) => chunk.id))
  const invalidChunkId = chunkIds.find((chunkId) => !validChunkIds.has(chunkId))

  if (invalidChunkId) {
    return `Invalid source chunk reference "${invalidChunkId}"`
  }

  return null
}

async function fetchValidatedGenerationRun(
  generationRunId: string,
  documentId: string,
  organizationId: string
): Promise<{ output_summary: Json } | null> {
  const supabase = createAdminClient()

  const { data: generationRun, error } = await supabase
    .from("ai_generation_runs")
    .select("output_summary")
    .eq("id", generationRunId)
    .eq("document_id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to validate generation run: ${error.message}`)
  }

  return generationRun
}

export async function POST(request: Request) {
  // TODO: Enforce real admin authorization before production.
  try {
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
    const saveableQuestions = filterSaveableQuestions(input.questions)

    if (saveableQuestions.length === 0) {
      return jsonError("At least one approved question is required", 400)
    }

    const document = await fetchDocumentById(input.documentId)

    if (!document) {
      return jsonError("Document not found", 404)
    }

    const sourceChunkError = await validateSourceChunkIds(
      document.id,
      document.organizationId,
      saveableQuestions
    )

    if (sourceChunkError) {
      return jsonError(sourceChunkError, 422)
    }

    let generationRunSummary: Json | null = null

    if (input.generationRunId) {
      const generationRun = await fetchValidatedGenerationRun(
        input.generationRunId,
        document.id,
        document.organizationId
      )

      if (!generationRun) {
        return jsonError("Invalid generation run for this document", 422)
      }

      generationRunSummary = generationRun.output_summary
    }

    const supabase = createAdminClient()
    const publishedAt = new Date().toISOString()

    // TODO: Replace with DB transaction/RPC before production.
    const { data: savedTest, error: insertTestError } = await supabase
      .from("tests")
      .insert({
        organization_id: document.organizationId,
        source_document_id: document.id,
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
      })
      .select("id")
      .single()

    if (insertTestError || !savedTest) {
      console.error("Failed to insert test:", insertTestError?.message)
      return jsonError("Failed to save generated test", 500)
    }

    const questionRows = saveableQuestions.map((question, index) => ({
      organization_id: document.organizationId,
      test_id: savedTest.id,
      source_chunk_id: question.sourceChunkId ?? null,
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
          } satisfies Json,
        })
        .eq("id", input.generationRunId)
        .eq("document_id", document.id)
        .eq("organization_id", document.organizationId)

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
    console.error("Publish generated test API error:", error)
    return jsonError("Internal server error", 500)
  }
}
