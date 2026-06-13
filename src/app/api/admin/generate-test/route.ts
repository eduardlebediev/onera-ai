import { openai } from "@ai-sdk/openai"
import { generateObject, JSONParseError, NoObjectGeneratedError, TypeValidationError } from "ai"
import { NextResponse } from "next/server"
import OpenAI from "openai"

import { buildGenerateTestPrompt } from "@/features/tests/lib/generate-test-prompt"
import { getLatestReadyDocumentVersionForDocument } from "@/features/documents/lib/document-versioning"
import { validateGeneratedChunkReferences } from "@/features/tests/lib/multi-document-generation"
import type { RetrievedChunk } from "@/features/tests/lib/retrieve-document-context"
import {
  EMBEDDING_MODEL,
  InsufficientContextError,
  retrieveMultiDocumentContext,
} from "@/features/tests/lib/retrieve-document-context"
import {
  SourceDocumentValidationError,
  validateSelectableDocumentsForGeneration,
} from "@/features/tests/lib/source-document-validation"
import {
  GeneratedTestDraftLlmSchema,
  GeneratedTestDraftSchema,
  GenerateTestRequestSchema,
  normalizeGenerateTestDocumentIds,
  validateDraftAgainstRetrievedChunks,
} from "@/features/tests/schemas/generated-test-schema"
import type {
  GeneratedTestDraft,
  QuestionType,
  TestDifficulty,
  TestLanguage,
} from "@/features/tests/schemas/generated-test-schema"
import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
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
  input: EffectiveGenerationSettings,
  retrievedChunks: RetrievedChunk[]
): GeneratedTestDraft {
  const chunkMetaById = new Map(
    retrievedChunks.map((chunk) => [
      chunk.id,
      {
        title: chunk.title ?? "Untitled chunk",
        documentId: chunk.documentId,
        documentTitle: input.documentsById.get(chunk.documentId)?.title ?? "Unknown document",
        topic: chunk.topic,
      },
    ])
  )

  return {
    ...generatedDraft,
    title: input.templateTitle
      ? `${input.templateTitle} (Latest version draft)`
      : generatedDraft.title,
    difficulty: input.difficulty,
    language: input.language,
    targetRole: input.targetRole,
    passingScore: input.passingScore,
    questions: generatedDraft.questions.map((question) => {
      const chunkMeta = chunkMetaById.get(question.sourceChunkId)

      return {
        ...question,
        sourceChunkTitle: chunkMeta?.title ?? question.sourceChunkTitle,
        sourceDocumentId: chunkMeta?.documentId ?? question.sourceDocumentId,
        sourceDocumentTitle: chunkMeta?.documentTitle ?? question.sourceDocumentTitle,
      }
    }),
  }
}

type EffectiveGenerationSettings = {
  documentIds: string[]
  documentsById: Map<string, { id: string; title: string; organizationId: string }>
  questionCount: number
  difficulty: TestDifficulty
  language: TestLanguage
  targetRole: string
  passingScore: number
  questionTypes: QuestionType[]
  templateTestId?: string
  templateTitle?: string
  selectedTopicIds?: string[]
  selectedChunkIds?: string[]
}

type TemplateTestRow = {
  id: string
  title: string
  organization_id: string
  source_document_id: string | null
  difficulty: string
  language: string
  target_role: string | null
  question_count: number | null
  passing_score: number
}

function normalizeDifficulty(value: string): TestDifficulty {
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium"
}

function normalizeLanguage(value: string): TestLanguage {
  return value === "de" ? "de" : "en"
}

function clampQuestionCount(value: number | null, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Math.max(Math.trunc(value), 3), 10)
}

function clampPassingScore(value: number): number {
  return Math.min(Math.max(Math.trunc(value), 0), 100)
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
  let generationRunId: string | null = null

  try {
    const admin = await requireAdminApiUser()

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
    const normalizedDocumentIds = normalizeGenerateTestDocumentIds(input)

    if (!process.env.OPENAI_API_KEY) {
      return jsonError("Server configuration error", 500)
    }

    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    let validatedDocuments

    try {
      validatedDocuments = await validateSelectableDocumentsForGeneration({
        organizationId: admin.membership.organizationId,
        documentIds: normalizedDocumentIds,
      })
    } catch (error) {
      if (error instanceof SourceDocumentValidationError) {
        return jsonError(error.message, 400)
      }

      throw error
    }

    const supabase = createAdminClient()
    const documentsById = new Map(
      validatedDocuments.documents.map((document) => [document.id, document])
    )

    const effectiveSettings: EffectiveGenerationSettings = {
      documentIds: validatedDocuments.documentIds,
      documentsById,
      questionCount: input.questionCount,
      difficulty: input.difficulty,
      language: input.language,
      targetRole: input.targetRole,
      passingScore: 70,
      questionTypes: input.questionTypes,
      templateTestId: input.templateTestId,
      selectedTopicIds: input.selectedTopicIds,
      selectedChunkIds: input.selectedChunkIds,
    }

    if (input.templateTestId) {
      const { data: templateTest, error: templateError } = await supabase
        .from("tests")
        .select(
          "id, title, organization_id, source_document_id, difficulty, language, target_role, question_count, passing_score"
        )
        .eq("id", input.templateTestId)
        .eq("organization_id", admin.membership.organizationId)
        .maybeSingle()

      if (templateError) {
        throw new Error(`Failed to fetch template test: ${templateError.message}`)
      }

      if (!templateTest) {
        return jsonError("Template test not found", 404)
      }

      const template = templateTest as TemplateTestRow

      if (!template.source_document_id) {
        return jsonError("Template test has no source document", 422)
      }

      const latestVersion = await getLatestReadyDocumentVersionForDocument(
        template.source_document_id
      )

      if (!latestVersion) {
        return jsonError("Latest source document version is not ready for generation", 422)
      }

      const templateValidated = await validateSelectableDocumentsForGeneration({
        organizationId: admin.membership.organizationId,
        documentIds: [latestVersion.id],
      })

      effectiveSettings.documentIds = templateValidated.documentIds
      effectiveSettings.documentsById = new Map(
        templateValidated.documents.map((document) => [document.id, document])
      )
      effectiveSettings.questionCount = clampQuestionCount(
        template.question_count,
        input.questionCount
      )
      effectiveSettings.difficulty = normalizeDifficulty(template.difficulty)
      effectiveSettings.language = normalizeLanguage(template.language)
      effectiveSettings.targetRole = template.target_role ?? input.targetRole
      effectiveSettings.passingScore = clampPassingScore(template.passing_score)
      effectiveSettings.templateTitle = template.title
    }

    const primaryDocument = effectiveSettings.documentsById.get(effectiveSettings.documentIds[0])

    if (!primaryDocument) {
      return jsonError("Primary source document not found", 404)
    }

    const { data: generationRun, error: createRunError } = await supabase
      .from("ai_generation_runs")
      .insert({
        organization_id: primaryDocument.organizationId,
        document_id: primaryDocument.id,
        status: "pending",
        model: GENERATION_MODEL,
        embedding_model: EMBEDDING_MODEL,
        input_config: {
          documentIds: effectiveSettings.documentIds,
          selectedTopicIds: effectiveSettings.selectedTopicIds ?? [],
          selectedChunkIds: effectiveSettings.selectedChunkIds ?? [],
          questionCount: effectiveSettings.questionCount,
          difficulty: effectiveSettings.difficulty,
          language: effectiveSettings.language,
          targetRole: effectiveSettings.targetRole,
          questionTypes: effectiveSettings.questionTypes,
          templateTestId: effectiveSettings.templateTestId ?? null,
        } satisfies Json,
        retrieved_chunk_ids: [],
        created_by: admin.userId,
      })
      .select("id")
      .single()

    if (createRunError || !generationRun) {
      throw new Error(createRunError?.message ?? "Failed to create ai_generation_runs row")
    }

    generationRunId = generationRun.id

    let context

    try {
      context = await retrieveMultiDocumentContext({
        documents: effectiveSettings.documentIds.map((documentId) => {
          const document = effectiveSettings.documentsById.get(documentId)

          if (!document) {
            throw new InsufficientContextError(`Missing document metadata for ${documentId}`)
          }

          return {
            id: document.id,
            title: document.title,
            organizationId: document.organizationId,
          }
        }),
        questionCount: effectiveSettings.questionCount,
        difficulty: effectiveSettings.difficulty,
        language: effectiveSettings.language,
        targetRole: effectiveSettings.targetRole,
        openai: openaiClient,
        selectedChunkIds: effectiveSettings.selectedChunkIds,
        selectedTopicIds: effectiveSettings.selectedTopicIds,
      })
    } catch (error) {
      if (error instanceof InsufficientContextError) {
        await markGenerationRunFailed(generationRunId, error.message)
        return jsonError(error.message, 422)
      }

      throw error
    }

    const retrievedChunkIds = context.chunks.map((chunk) => chunk.id)
    const chunkDocumentById = new Map(context.chunks.map((chunk) => [chunk.id, chunk.documentId]))
    const allowedDocumentIds = new Set(effectiveSettings.documentIds)

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
      documents: context.documents,
      questionCount: effectiveSettings.questionCount,
      difficulty: effectiveSettings.difficulty,
      language: effectiveSettings.language,
      targetRole: effectiveSettings.targetRole,
      questionTypes: effectiveSettings.questionTypes,
      chunks: context.chunks.map((chunk) => ({
        id: chunk.id,
        documentId: chunk.documentId,
        documentTitle:
          effectiveSettings.documentsById.get(chunk.documentId)?.title ?? "Unknown document",
        title: chunk.title,
        topic: chunk.topic,
        content: chunk.content,
      })),
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

    const normalizedDraftInput = normalizeGeneratedDraft(
      generatedDraft,
      effectiveSettings,
      context.chunks
    )
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
    const chunkValidationError =
      validateDraftAgainstRetrievedChunks(
        validatedDraft.data,
        retrievedChunkIdSet,
        effectiveSettings.questionCount,
        chunkDocumentById,
        allowedDocumentIds
      ) ??
      validateGeneratedChunkReferences({
        chunkIds: validatedDraft.data.questions.map((question) => question.sourceChunkId),
        allowedChunkIds: retrievedChunkIdSet,
        allowedDocumentIds,
        chunkDocumentById,
      })

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
          document_ids: effectiveSettings.documentIds,
        } satisfies Json,
        completed_at: new Date().toISOString(),
      })
      .eq("id", generationRunId)

    if (completeRunError) {
      throw new Error(`Failed to complete ai_generation_runs row: ${completeRunError.message}`)
    }

    const responseDocuments = effectiveSettings.documentIds.flatMap((documentId) => {
      const document = effectiveSettings.documentsById.get(documentId)

      if (!document) {
        return []
      }

      return [{ id: document.id, title: document.title }]
    })

    return NextResponse.json({
      generationRunId,
      document: responseDocuments[0],
      documents: responseDocuments,
      draft: validatedDraft.data,
      retrievedChunks: context.chunks.map((chunk) => ({
        id: chunk.id,
        documentId: chunk.documentId,
        documentTitle:
          effectiveSettings.documentsById.get(chunk.documentId)?.title ?? "Unknown document",
        title: chunk.title,
        topic: chunk.topic,
        similarity: chunk.similarity,
      })),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof SourceDocumentValidationError) {
      return jsonError(error.message, 400)
    }

    const message = error instanceof Error ? error.message : "Unexpected server error"
    console.error("Generate test API error:", error)

    if (generationRunId) {
      await markGenerationRunFailed(generationRunId, message)
    }

    return jsonError("Internal server error", 500)
  }
}
