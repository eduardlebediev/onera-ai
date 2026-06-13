import { NextResponse } from "next/server"

import { getDraftTestForReview } from "@/features/tests/lib/draft-test"
import { regenerateSingleQuestion } from "@/features/tests/lib/regenerate-single-question"
import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

interface RegenerateQuestionRouteContext {
  params: Promise<{ id: string; questionId: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
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

export async function POST(_request: Request, { params }: RegenerateQuestionRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id: testId, questionId } = await params
    const organizationId = admin.membership.organizationId

    const draft = await getDraftTestForReview(testId, organizationId)
    if (!draft) {
      return jsonError("Draft test not found", 404)
    }

    const generationRunId = draft.generationRunId

    const supabase = createAdminClient()

    const { data: questionRow, error: questionError } = await supabase
      .from("test_questions")
      .select(
        "id, question_type, topic, difficulty, source_chunk_id, source_document_id, source_status"
      )
      .eq("id", questionId)
      .eq("test_id", testId)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (questionError) {
      return jsonError("Failed to fetch question", 500)
    }

    if (!questionRow) {
      return jsonError("Question not found", 404)
    }

    if (questionRow.source_status === "manual_kept" || !questionRow.source_chunk_id) {
      return jsonError("Only AI-generated questions can be regenerated", 400)
    }

    const { data: chunkRow, error: chunkError } = await supabase
      .from("document_chunks")
      .select("id, document_id, title, topic, content, documents(title)")
      .eq("id", questionRow.source_chunk_id)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (chunkError || !chunkRow) {
      return jsonError("Source chunk not found for regeneration", 422)
    }

    const documentTitle =
      chunkRow.documents &&
      typeof chunkRow.documents === "object" &&
      "title" in chunkRow.documents &&
      typeof (chunkRow.documents as { title?: string }).title === "string"
        ? (chunkRow.documents as { title: string }).title
        : "Source document"

    const { data: testDocuments } = await supabase
      .from("test_documents")
      .select("document_id, documents(id, title)")
      .eq("test_id", testId)
      .eq("organization_id", organizationId)

    const documents: Array<{ id: string; title: string }> = []

    for (const row of testDocuments ?? []) {
      const document = row.documents as { id?: string; title?: string } | null
      if (document?.id && document.title) {
        documents.push({ id: document.id, title: document.title })
      }
    }

    const regenerated = await regenerateSingleQuestion({
      questionType: questionRow.question_type as
        | "single_choice"
        | "multiple_choice"
        | "true_false"
        | "open_question",
      topic: questionRow.topic ?? "General",
      difficulty: (questionRow.difficulty ?? draft.test.difficulty) as "easy" | "medium" | "hard",
      language: draft.test.language as "en" | "de",
      targetRole: draft.test.target_role ?? "General employee",
      chunk: {
        id: chunkRow.id,
        documentId: chunkRow.document_id,
        documentTitle,
        title: chunkRow.title,
        topic: chunkRow.topic,
        content: chunkRow.content,
      },
      documents,
    })

    if (!regenerated) {
      return jsonError("Failed to regenerate question", 502)
    }

    const { data: updatedQuestion, error: updateError } = await supabase
      .from("test_questions")
      .update({
        question_text: regenerated.questionText,
        question_type: regenerated.questionType,
        options: regenerated.options as unknown as Json,
        correct_answer: regenerated.correctAnswer as unknown as Json,
        explanation: regenerated.explanation,
        topic: regenerated.topic,
        difficulty: regenerated.difficulty,
        source_chunk_id: regenerated.sourceChunkId,
        source_document_id: regenerated.sourceDocumentId ?? chunkRow.document_id,
        source_status: "valid",
        review_status: "pending",
      })
      .eq("id", questionId)
      .eq("test_id", testId)
      .eq("organization_id", organizationId)
      .select(
        "id, question_text, question_type, options, correct_answer, explanation, topic, difficulty, order_index, source_chunk_id, source_document_id, source_status, review_status"
      )
      .single()

    if (updateError || !updatedQuestion) {
      return jsonError("Failed to save regenerated question", 500)
    }

    const options = parseOptions(updatedQuestion.options)
    const correctAnswer =
      typeof updatedQuestion.correct_answer === "object" &&
      updatedQuestion.correct_answer !== null &&
      "expectedAnswer" in updatedQuestion.correct_answer &&
      typeof (updatedQuestion.correct_answer as { expectedAnswer?: string }).expectedAnswer ===
        "string"
        ? (updatedQuestion.correct_answer as { expectedAnswer: string }).expectedAnswer
        : (options.find((option) =>
            Array.isArray(
              (updatedQuestion.correct_answer as { optionIds?: string[] } | null)?.optionIds
            )
              ? (updatedQuestion.correct_answer as { optionIds: string[] }).optionIds.includes(
                  option.id
                )
              : false
          )?.text ??
          options[0]?.text ??
          "")

    return NextResponse.json({
      question: {
        id: generationRunId
          ? `ai-${generationRunId}-q-${updatedQuestion.order_index + 1}`
          : `db-${updatedQuestion.id}`,
        dbQuestionId: updatedQuestion.id,
        questionText: updatedQuestion.question_text,
        questionType: updatedQuestion.question_type,
        options: options.map((option) => option.text),
        correctAnswer,
        correctAnswers: [correctAnswer],
        expectedAnswer:
          typeof updatedQuestion.correct_answer === "object" &&
          updatedQuestion.correct_answer !== null &&
          "expectedAnswer" in updatedQuestion.correct_answer
            ? (updatedQuestion.correct_answer as { expectedAnswer?: string }).expectedAnswer
            : undefined,
        explanation: updatedQuestion.explanation ?? "",
        topic: updatedQuestion.topic ?? "General",
        difficulty: updatedQuestion.difficulty ?? "medium",
        status: "needs_review",
        isAiGenerated: true,
        sourceChunkId: updatedQuestion.source_chunk_id,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Regenerate question API error:", error)
    return jsonError("Internal server error", 500)
  }
}
