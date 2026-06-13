import "server-only"

import { insertTestDocuments } from "@/features/tests/lib/test-documents"
import { buildSourceLabel } from "@/features/tests/lib/source-label"
import type {
  GeneratedTestDraft,
  GeneratedTestQuestion,
} from "@/features/tests/schemas/generated-test-schema"
import {
  mapDbReviewStatusToReview,
  mapReviewStatusToDb,
  type ReviewStatus,
} from "@/features/tests/schemas/review-question-schema"
import type { ReviewQuestion } from "@/features/tests/mock/generated-test-review"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

type DraftTestRow = {
  id: string
  organization_id: string
  status: string
  title: string
  description: string | null
  difficulty: string
  language: string
  target_role: string | null
  passing_score: number
  source_document_id: string | null
}

type DraftQuestionRow = {
  id: string
  test_id: string
  organization_id: string
  question_text: string
  question_type: string
  options: Json
  correct_answer: Json
  explanation: string | null
  topic: string | null
  difficulty: string | null
  order_index: number
  source_chunk_id: string | null
  source_document_id: string | null
  source_status: string
  review_status: string
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

function parseCorrectAnswer(value: Json): { optionIds?: string[]; expectedAnswer?: string } {
  if (typeof value !== "object" || value === null) {
    return {}
  }

  const record = value as Record<string, unknown>
  const optionIds = Array.isArray(record.optionIds)
    ? record.optionIds.filter((id): id is string => typeof id === "string")
    : undefined
  const expectedAnswer =
    typeof record.expectedAnswer === "string" ? record.expectedAnswer : undefined

  return { optionIds, expectedAnswer }
}

function resolveCorrectAnswerTexts(
  questionType: string,
  options: Array<{ id: string; text: string }>,
  correctAnswer: { optionIds?: string[]; expectedAnswer?: string }
): string[] {
  if (questionType === "open_question") {
    return correctAnswer.expectedAnswer ? [correctAnswer.expectedAnswer] : []
  }

  const optionById = new Map(options.map((option) => [option.id, option.text]))
  return (correctAnswer.optionIds ?? [])
    .map((optionId) => optionById.get(optionId))
    .filter((text): text is string => Boolean(text))
}

function mapDraftQuestionRowToReviewQuestion(
  row: DraftQuestionRow,
  generationRunId: string | null,
  orderIndex: number
): ReviewQuestion {
  const options = parseOptions(row.options)
  const correctAnswer = parseCorrectAnswer(row.correct_answer)
  const correctAnswerTexts = resolveCorrectAnswerTexts(row.question_type, options, correctAnswer)
  const primaryCorrectAnswer = correctAnswerTexts[0] ?? options[0]?.text ?? ""
  const documentTitle = "Source document"
  const sourceChunkReference = row.source_chunk_id
    ? buildSourceLabel({
        documentTitle,
        topic: row.topic ?? "General",
        chunkTitle: row.source_chunk_id.slice(0, 8),
      })
    : "Manual question"

  return {
    id: generationRunId ? `ai-${generationRunId}-q-${orderIndex + 1}` : `db-${row.id}`,
    dbQuestionId: row.id,
    questionText: row.question_text,
    questionType: row.question_type as ReviewQuestion["questionType"],
    options: options.map((option) => option.text),
    correctAnswer: primaryCorrectAnswer,
    correctAnswers: correctAnswerTexts.length > 0 ? correctAnswerTexts : [primaryCorrectAnswer],
    expectedAnswer: correctAnswer.expectedAnswer,
    explanation: row.explanation ?? "",
    topic: row.topic ?? "General",
    sourceChunkReference,
    sourceChunkId: row.source_chunk_id,
    testedSkill: "Knowledge recall",
    pedagogicalGoal: "Verify understanding of source document content",
    difficulty: (row.difficulty ?? "medium") as ReviewQuestion["difficulty"],
    whyUseful:
      row.source_status === "manual_kept"
        ? "Added manually during admin review."
        : "Grounded in retrieved document chunks for admin review before publishing.",
    status: mapDbReviewStatusToReview(row.review_status),
    isAiGenerated: row.source_status !== "manual_kept" && Boolean(row.source_chunk_id),
  }
}

function mapGeneratedQuestionToInsertRow(input: {
  question: GeneratedTestQuestion
  organizationId: string
  testId: string
  orderIndex: number
}) {
  const { question, organizationId, testId, orderIndex } = input

  return {
    organization_id: organizationId,
    test_id: testId,
    source_chunk_id: question.sourceChunkId,
    source_document_id: question.sourceDocumentId ?? null,
    is_active: true,
    source_status: "valid" as const,
    review_status: "pending" as const,
    question_text: question.questionText,
    question_type: question.questionType,
    options: question.options as unknown as Json,
    correct_answer: question.correctAnswer as unknown as Json,
    explanation: question.explanation,
    topic: question.topic,
    difficulty: question.difficulty,
    order_index: orderIndex,
  }
}

export async function createDraftTestFromGeneration(input: {
  organizationId: string
  generationRunId: string
  primaryDocumentId: string
  documentIds: string[]
  draft: GeneratedTestDraft
}): Promise<string> {
  const supabase = createAdminClient()

  const { data: savedTest, error: insertTestError } = await supabase
    .from("tests")
    .insert({
      organization_id: input.organizationId,
      source_document_id: input.primaryDocumentId,
      title: input.draft.title,
      description: input.draft.description,
      status: "draft",
      difficulty: input.draft.difficulty,
      language: input.draft.language,
      target_role: input.draft.targetRole,
      question_count: input.draft.questions.length,
      passing_score: input.draft.passingScore,
      created_by: null,
      published_at: null,
      is_active: true,
      source_validity: "valid",
    })
    .select("id")
    .single()

  if (insertTestError || !savedTest) {
    throw new Error(`Failed to create draft test: ${insertTestError?.message ?? "unknown error"}`)
  }

  await insertTestDocuments({
    testId: savedTest.id,
    organizationId: input.organizationId,
    documentIds: input.documentIds,
  })

  const questionRows = input.draft.questions.map((question, index) =>
    mapGeneratedQuestionToInsertRow({
      question,
      organizationId: input.organizationId,
      testId: savedTest.id,
      orderIndex: index,
    })
  )

  const { error: insertQuestionsError } = await supabase.from("test_questions").insert(questionRows)

  if (insertQuestionsError) {
    throw new Error(`Failed to create draft test questions: ${insertQuestionsError.message}`)
  }

  const { error: linkRunError } = await supabase
    .from("ai_generation_runs")
    .update({ test_id: savedTest.id })
    .eq("id", input.generationRunId)

  if (linkRunError) {
    console.warn("Failed to link generation run to draft test:", linkRunError.message)
  }

  return savedTest.id
}

export async function getDraftTestForReview(
  testId: string,
  organizationId: string
): Promise<{
  test: DraftTestRow
  questions: ReviewQuestion[]
  generationRunId: string | null
} | null> {
  const supabase = createAdminClient()

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select(
      "id, organization_id, status, title, description, difficulty, language, target_role, passing_score, source_document_id"
    )
    .eq("id", testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (testError) {
    throw new Error(`Failed to fetch draft test: ${testError.message}`)
  }

  if (!test || (test.status !== "draft" && test.status !== "review")) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from("test_questions")
    .select(
      "id, test_id, organization_id, question_text, question_type, options, correct_answer, explanation, topic, difficulty, order_index, source_chunk_id, source_document_id, source_status, review_status"
    )
    .eq("test_id", testId)
    .eq("organization_id", organizationId)
    .order("order_index", { ascending: true })

  if (questionsError) {
    throw new Error(`Failed to fetch draft test questions: ${questionsError.message}`)
  }

  const { data: generationRun } = await supabase
    .from("ai_generation_runs")
    .select("id")
    .eq("test_id", testId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const generationRunId = generationRun?.id ?? null

  return {
    test: test as DraftTestRow,
    questions: ((questions ?? []) as DraftQuestionRow[]).map((row, index) =>
      mapDraftQuestionRowToReviewQuestion(row, generationRunId, index)
    ),
    generationRunId,
  }
}

export function mapReviewQuestionToDbPayload(
  question: ReviewQuestion,
  orderIndex: number
): {
  question_text: string
  question_type: string
  options: Json
  correct_answer: Json
  explanation: string
  topic: string
  difficulty: string
  order_index: number
  source_chunk_id: string | null
  source_document_id: string | null
  source_status: string
  review_status: string
} {
  const options =
    question.questionType === "open_question"
      ? []
      : question.options.map((text, index) => ({
          id: `opt-${String.fromCharCode(97 + index)}`,
          text,
        }))

  const optionIdByText = new Map(options.map((option) => [option.text, option.id] as const))
  const correctTexts =
    question.correctAnswers && question.correctAnswers.length > 0
      ? question.correctAnswers
      : [question.correctAnswer]
  const optionIds = correctTexts
    .map((text) => optionIdByText.get(text))
    .filter((optionId): optionId is string => Boolean(optionId))

  const correctAnswer: Json =
    question.questionType === "open_question"
      ? { expectedAnswer: question.expectedAnswer ?? question.correctAnswer }
      : {
          optionIds:
            optionIds.length > 0 ? optionIds : options.slice(0, 1).map((option) => option.id),
        }

  return {
    question_text: question.questionText,
    question_type: question.questionType,
    options: options as unknown as Json,
    correct_answer: correctAnswer,
    explanation: question.explanation,
    topic: question.topic,
    difficulty: question.difficulty,
    order_index: orderIndex,
    source_chunk_id: question.sourceChunkId ?? null,
    source_document_id: null,
    source_status: question.isAiGenerated ? "valid" : "manual_kept",
    review_status: mapReviewStatusToDb(question.status),
  }
}

export function mapReviewStatusForPublish(
  status: ReviewStatus
): "approved" | "rejected" | "needs_edit" | undefined {
  if (status === "rejected") return "rejected"
  if (status === "edited") return "needs_edit"
  if (status === "approved") return "approved"
  return undefined
}
