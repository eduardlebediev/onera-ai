import "server-only"

import { getLatestDocumentVersionForDocument } from "@/features/documents/lib/document-versioning"
import { buildSourceLabel } from "@/features/tests/lib/source-label"
import { getTestSourceDocumentsByTestId } from "@/features/tests/lib/test-documents"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

export type SavedTestQuestion = {
  id: string
  questionText: string
  questionType: string
  options: Array<{ id: string; text: string }>
  correctAnswer: { optionIds: string[] }
  explanation: string | null
  topic: string | null
  difficulty: string | null
  orderIndex: number
  sourceChunkId: string | null
  sourceDocumentId: string | null
  sourceLabel: string | null
  isActive: boolean
  sourceStatus: string
  sourceInvalidReason: string | null
}

export type SavedTestSourceDocument = {
  documentId: string
  title: string
  status: string
  versionNumber: number | null
  isLatest: boolean
}

export type SavedTestDetail = {
  id: string
  title: string
  description: string | null
  status: string
  difficulty: string
  language: string
  targetRole: string | null
  passingScore: number
  questionCount: number
  publishedAt: string | null
  isActive: boolean
  sourceValidity: string
  sourceInvalidReason: string | null
  sourceDocumentId: string | null
  sourceDocumentTitle: string | null
  sourceDocumentVersionNumber: number | null
  sourceDocumentIsLatest: boolean
  latestSourceDocumentId: string | null
  sourceDocuments: SavedTestSourceDocument[]
  questions: SavedTestQuestion[]
}

function parseOptions(value: Json): Array<{ id: string; text: string }> {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "text" in item &&
      typeof item.id === "string" &&
      typeof item.text === "string"
    ) {
      return [{ id: item.id, text: item.text }]
    }

    return []
  })
}

function parseCorrectAnswer(value: Json): { optionIds: string[] } {
  if (
    typeof value === "object" &&
    value !== null &&
    "optionIds" in value &&
    Array.isArray(value.optionIds)
  ) {
    return {
      optionIds: value.optionIds.filter(
        (optionId): optionId is string => typeof optionId === "string"
      ),
    }
  }

  return { optionIds: [] }
}

export async function getSavedTestDetailById(testId: string): Promise<SavedTestDetail | null> {
  const supabase = createAdminClient()

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select(
      "id, title, description, status, difficulty, language, target_role, passing_score, question_count, published_at, source_document_id, is_active, source_validity, source_invalid_reason"
    )
    .eq("id", testId)
    .maybeSingle()

  if (testError) {
    console.error(`Failed to fetch saved test: ${testError.message}`)
    return null
  }

  if (!test) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from("test_questions")
    .select(
      "id, question_text, question_type, options, correct_answer, explanation, topic, difficulty, order_index, source_chunk_id, source_document_id, is_active, source_status, source_invalid_reason"
    )
    .eq("test_id", testId)
    .order("order_index", { ascending: true })

  if (questionsError) {
    console.error(`Failed to fetch saved test questions: ${questionsError.message}`)
    return null
  }

  const sourceDocuments = await getTestSourceDocumentsByTestId({
    testId,
    fallbackSourceDocumentId: test.source_document_id,
  })

  const sourceDocumentId: string | null = test.source_document_id
  let sourceDocumentTitle: string | null = null
  let sourceDocumentVersionNumber: number | null = null
  let sourceDocumentIsLatest = true
  let latestSourceDocumentId: string | null = null

  if (test.source_document_id) {
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, title, version_number, is_latest, replaced_by_document_id")
      .eq("id", test.source_document_id)
      .maybeSingle()

    if (documentError) {
      console.error(`Failed to fetch source document: ${documentError.message}`)
      return null
    }

    sourceDocumentTitle = document?.title ?? sourceDocuments[0]?.title ?? null
    sourceDocumentVersionNumber =
      document?.version_number ?? sourceDocuments[0]?.versionNumber ?? null
    sourceDocumentIsLatest =
      document?.is_latest !== false && !document?.replaced_by_document_id
        ? (sourceDocuments[0]?.isLatest ?? true)
        : false

    if (document && !sourceDocumentIsLatest) {
      const latestDocument = await getLatestDocumentVersionForDocument(document.id)
      latestSourceDocumentId = latestDocument?.id ?? document.replaced_by_document_id ?? null
    } else {
      latestSourceDocumentId = document?.id ?? sourceDocuments[0]?.documentId ?? null
    }
  }

  const sourceDocumentTitleById = new Map(
    sourceDocuments.map((document) => [document.documentId, document.title])
  )

  const chunkIds = (questions ?? [])
    .map((question) => question.source_chunk_id)
    .filter((chunkId): chunkId is string => Boolean(chunkId))

  const chunkMetaById = new Map<string, { title: string | null; topic: string | null }>()

  if (chunkIds.length > 0) {
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("id, title, topic")
      .in("id", chunkIds)

    if (chunksError) {
      console.error(`Failed to fetch question source chunks: ${chunksError.message}`)
    } else {
      for (const chunk of chunks ?? []) {
        chunkMetaById.set(chunk.id, { title: chunk.title, topic: chunk.topic })
      }
    }
  }

  return {
    id: test.id,
    title: test.title,
    description: test.description,
    status: test.status,
    difficulty: test.difficulty,
    language: test.language,
    targetRole: test.target_role,
    passingScore: test.passing_score,
    questionCount: test.question_count ?? questions?.length ?? 0,
    publishedAt: test.published_at,
    isActive: test.is_active ?? true,
    sourceValidity: test.source_validity ?? "valid",
    sourceInvalidReason: test.source_invalid_reason,
    sourceDocumentId,
    sourceDocumentTitle,
    sourceDocumentVersionNumber,
    sourceDocumentIsLatest,
    latestSourceDocumentId,
    sourceDocuments,
    questions: (questions ?? []).map((question) => {
      const chunkMeta = question.source_chunk_id
        ? chunkMetaById.get(question.source_chunk_id)
        : undefined
      const documentTitle =
        (question.source_document_id
          ? sourceDocumentTitleById.get(question.source_document_id)
          : null) ?? sourceDocumentTitle

      return {
        id: question.id,
        questionText: question.question_text,
        questionType: question.question_type,
        options: parseOptions(question.options),
        correctAnswer: parseCorrectAnswer(question.correct_answer),
        explanation: question.explanation,
        topic: question.topic,
        difficulty: question.difficulty,
        orderIndex: question.order_index,
        sourceChunkId: question.source_chunk_id,
        sourceDocumentId: question.source_document_id,
        sourceLabel: documentTitle
          ? buildSourceLabel({
              documentTitle,
              topic: question.topic,
              chunkTitle: chunkMeta?.title,
            })
          : null,
        isActive: question.is_active ?? true,
        sourceStatus: question.source_status ?? "valid",
        sourceInvalidReason: question.source_invalid_reason,
      }
    }),
  }
}
