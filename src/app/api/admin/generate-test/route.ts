import { openai } from "@ai-sdk/openai"
import { generateObject, JSONParseError, NoObjectGeneratedError, TypeValidationError } from "ai"
import { NextResponse } from "next/server"
import OpenAI from "openai"

import { buildGenerateTestPrompt } from "@/features/tests/lib/generate-test-prompt"
import type { RetrievedChunk } from "@/features/tests/lib/retrieve-document-context"
import {
  EMBEDDING_MODEL,
  fetchDocumentById,
  InsufficientContextError,
  retrieveDocumentContext,
} from "@/features/tests/lib/retrieve-document-context"
import {
  GeneratedTestDraftLlmSchema,
  GeneratedTestDraftSchema,
  GenerateTestRequestSchema,
  validateDraftAgainstRetrievedChunks,
} from "@/features/tests/schemas/generated-test-schema"
import type {
  GeneratedTestDraft,
  GenerateTestRequest,
} from "@/features/tests/schemas/generated-test-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

export const GENERATION_MODEL = "gpt-4.1-mini"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function isInvalidGeneratedOutputError(error: unknown): boolean {
  return (
    error instanceof JSONParseError ||
    error instanceof NoObjectGeneratedError ||
    error instanceof TypeValidationError
  )
}

function normalizeGeneratedDraft(
  generatedDraft: GeneratedTestDraft,
  input: GenerateTestRequest,
  retrievedChunks: RetrievedChunk[]
): GeneratedTestDraft {
  const chunkTitleById = new Map(
    retrievedChunks.map((chunk) => [chunk.id, chunk.title ?? "Untitled chunk"])
  )

  return {
    ...generatedDraft,
    difficulty: input.difficulty,
    language: input.language,
    targetRole: input.targetRole,
    passingScore: 70,
    questions: generatedDraft.questions.map((question) => ({
      ...question,
      sourceChunkTitle: chunkTitleById.get(question.sourceChunkId) ?? question.sourceChunkTitle,
    })),
  }
}

async function markGenerationRunFailed(
  generationRunId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("ai_generation_runs")
    .update({
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", generationRunId)

  if (error) {
    console.error("Failed to update ai_generation_runs to failed:", error.message)
  }
}

export async function POST(request: Request) {
  // TODO: Enforce real admin authorization before production.
  let generationRunId: string | null = null

  try {
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = GenerateTestRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const input = parsedRequest.data

    if (!process.env.OPENAI_API_KEY) {
      return jsonError("Server configuration error", 500)
    }

    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const document = await fetchDocumentById(input.documentId)

    if (!document) {
      return jsonError("Document not found", 404)
    }

    const supabase = createAdminClient()

    const { data: generationRun, error: createRunError } = await supabase
      .from("ai_generation_runs")
      .insert({
        organization_id: document.organizationId,
        document_id: document.id,
        status: "pending",
        model: GENERATION_MODEL,
        embedding_model: EMBEDDING_MODEL,
        input_config: {
          questionCount: input.questionCount,
          difficulty: input.difficulty,
          language: input.language,
          targetRole: input.targetRole,
        },
        retrieved_chunk_ids: [],
        created_by: null,
      })
      .select("id")
      .single()

    if (createRunError || !generationRun) {
      throw new Error(createRunError?.message ?? "Failed to create ai_generation_runs row")
    }

    generationRunId = generationRun.id

    let context

    try {
      context = await retrieveDocumentContext({
        document,
        questionCount: input.questionCount,
        difficulty: input.difficulty,
        language: input.language,
        targetRole: input.targetRole,
        openai: openaiClient,
      })
    } catch (error) {
      if (error instanceof InsufficientContextError) {
        await markGenerationRunFailed(generationRunId, error.message)
        return jsonError(error.message, 422)
      }

      throw error
    }

    const retrievedChunkIds = context.chunks.map((chunk) => chunk.id)

    const { error: updateChunksError } = await supabase
      .from("ai_generation_runs")
      .update({
        retrieved_chunk_ids: retrievedChunkIds,
      })
      .eq("id", generationRunId)

    if (updateChunksError) {
      throw new Error(`Failed to update retrieved_chunk_ids: ${updateChunksError.message}`)
    }

    const prompt = buildGenerateTestPrompt({
      documentTitle: context.document.title,
      questionCount: input.questionCount,
      difficulty: input.difficulty,
      language: input.language,
      targetRole: input.targetRole,
      chunks: context.chunks,
    })

    let generatedDraft

    try {
      const result = await generateObject({
        model: openai(GENERATION_MODEL),
        schema: GeneratedTestDraftLlmSchema,
        prompt,
      })

      generatedDraft = result.object
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI generation failed"
      console.error("Generate test AI error:", error)
      await markGenerationRunFailed(generationRunId, message)

      if (isInvalidGeneratedOutputError(error)) {
        return jsonError("Generated test draft failed validation", 422)
      }

      return jsonError("Failed to generate test draft", 500)
    }

    const normalizedDraftInput = normalizeGeneratedDraft(generatedDraft, input, context.chunks)
    const validatedDraft = GeneratedTestDraftSchema.safeParse(normalizedDraftInput)

    if (!validatedDraft.success) {
      const message = validatedDraft.error.issues.map((issue) => issue.message).join("; ")
      await markGenerationRunFailed(
        generationRunId,
        message || "Generated output failed validation"
      )
      return jsonError("Generated test draft failed validation", 422)
    }

    const retrievedChunkIdSet = new Set(retrievedChunkIds)
    const chunkValidationError = validateDraftAgainstRetrievedChunks(
      validatedDraft.data,
      retrievedChunkIdSet,
      input.questionCount
    )

    if (chunkValidationError) {
      await markGenerationRunFailed(generationRunId, chunkValidationError)
      return jsonError("Generated test draft failed validation", 422)
    }

    const topics = [...new Set(validatedDraft.data.questions.map((question) => question.topic))]

    const { error: completeRunError } = await supabase
      .from("ai_generation_runs")
      .update({
        status: "completed",
        output_summary: {
          question_count: validatedDraft.data.questions.length,
          topics,
          source_chunk_count: retrievedChunkIds.length,
        } satisfies Json,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generationRunId)

    if (completeRunError) {
      throw new Error(`Failed to complete ai_generation_runs row: ${completeRunError.message}`)
    }

    return NextResponse.json({
      generationRunId,
      document: {
        id: context.document.id,
        title: context.document.title,
      },
      draft: validatedDraft.data,
      retrievedChunks: context.chunks.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        topic: chunk.topic,
        similarity: chunk.similarity,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error"
    console.error("Generate test API error:", error)

    if (generationRunId) {
      await markGenerationRunFailed(generationRunId, message)
    }

    return jsonError("Internal server error", 500)
  }
}
