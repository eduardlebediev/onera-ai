import { NextResponse } from "next/server"

import { AuthError, requireEmployeeApiUser } from "@/features/auth/lib/require-auth"
import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import {
  generateFollowUpQuestion,
  isFollowUpQuestionOutputError,
  isFollowUpQuestionTimeoutError,
} from "@/features/employee/tests/lib/generate-follow-up-question"
import {
  getFollowUpQuestionByAttemptAndOriginalQuestion,
  insertFollowUpQuestion,
  mapFollowUpQuestionRowToFollowUp,
  stripCorrectAnswerFromFollowUp,
} from "@/features/employee/tests/lib/supabase-employee-follow-ups"
import {
  FollowUpQuestionOutputSchema,
  FollowUpQuestionPublicOutputSchema,
  GenerateFollowUpQuestionRequestSchema,
} from "@/features/employee/tests/schemas/follow-up-question-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocale } from "@/shared/i18n/get-locale"

interface GenerateFollowUpRouteContext {
  params: Promise<{ id: string }>
}

type AttemptRow = {
  id: string
  test_id: string
  user_id: string
  organization_id: string
  status: string
}

type AnswerRow = {
  is_correct: boolean | null
}

type QuestionRow = {
  id: string
  question_text: string
  explanation: string | null
  topic: string | null
  source_chunk_id: string | null
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function formatSourceChunkReference(sourceChunkId: string | null): string {
  return sourceChunkId ? `Chunk (${sourceChunkId.slice(0, 8)}...)` : "Source document"
}

function toPublicFollowUpResponse(followUp: ReturnType<typeof mapFollowUpQuestionRowToFollowUp>) {
  const parsed = FollowUpQuestionPublicOutputSchema.safeParse(
    stripCorrectAnswerFromFollowUp(followUp)
  )

  if (!parsed.success) {
    return null
  }

  return parsed.data
}

export async function POST(request: Request, { params }: GenerateFollowUpRouteContext) {
  try {
    const employee = await requireEmployeeApiUser()
    const { id: testId } = await params

    if (!isUuid(testId)) {
      if (isMockTestId(testId)) {
        return jsonError("Invalid test id", 400)
      }

      return jsonError("Invalid test id", 400)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = GenerateFollowUpQuestionRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const supabase = createAdminClient()
    const { attemptId, questionId } = parsedRequest.data
    const organizationId = employee.membership.organizationId

    const { data: attempt, error: attemptError } = await supabase
      .from("test_attempts")
      .select("id, test_id, user_id, organization_id, status")
      .eq("id", attemptId)
      .eq("test_id", testId)
      .eq("user_id", employee.userId)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (attemptError) {
      throw new Error(`Failed to fetch attempt: ${attemptError.message}`)
    }

    const attemptRow = attempt as AttemptRow | null
    if (!attemptRow || attemptRow.status !== "completed") {
      return jsonError("Completed attempt not found", 404)
    }

    const existingFollowUp = await getFollowUpQuestionByAttemptAndOriginalQuestion({
      attemptId,
      originalQuestionId: questionId,
      organizationId,
    })

    if (existingFollowUp) {
      const publicResponse = toPublicFollowUpResponse(
        mapFollowUpQuestionRowToFollowUp(existingFollowUp, false)
      )

      if (!publicResponse) {
        return jsonError("Could not load follow-up question", 500)
      }

      return NextResponse.json(publicResponse)
    }

    const [{ data: answer, error: answerError }, { data: question, error: questionError }] =
      await Promise.all([
        supabase
          .from("test_answers")
          .select("is_correct")
          .eq("attempt_id", attemptId)
          .eq("question_id", questionId)
          .eq("organization_id", organizationId)
          .maybeSingle(),
        supabase
          .from("test_questions")
          .select("id, question_text, explanation, topic, source_chunk_id")
          .eq("id", questionId)
          .eq("test_id", testId)
          .eq("organization_id", organizationId)
          .maybeSingle(),
      ])

    if (answerError) {
      throw new Error(`Failed to fetch answer: ${answerError.message}`)
    }

    if (questionError) {
      throw new Error(`Failed to fetch question: ${questionError.message}`)
    }

    const answerRow = answer as AnswerRow | null
    const questionRow = question as QuestionRow | null

    if (!answerRow || !questionRow) {
      return jsonError("Question result not found", 404)
    }

    if (answerRow.is_correct) {
      return jsonError("Follow-up questions are only available for incorrect answers", 400)
    }

    const generated = await generateFollowUpQuestion(
      questionRow.question_text,
      questionRow.topic ?? "General",
      questionRow.explanation ?? "",
      await getLocale()
    )

    const validatedGenerated = FollowUpQuestionOutputSchema.safeParse({
      ...generated,
      id: "pending-follow-up",
      originalQuestionId: questionRow.id,
      topic: questionRow.topic ?? generated.topic,
      sourceChunkReference: formatSourceChunkReference(questionRow.source_chunk_id),
    })

    if (!validatedGenerated.success) {
      return jsonError("Could not generate question. Try again.", 502)
    }

    const persisted = await insertFollowUpQuestion({
      organizationId,
      attemptId,
      originalQuestionId: questionRow.id,
      generated: validatedGenerated.data,
      sourceChunkReference: formatSourceChunkReference(questionRow.source_chunk_id),
    })

    const publicResponse = toPublicFollowUpResponse(
      mapFollowUpQuestionRowToFollowUp(persisted, false)
    )

    if (!publicResponse) {
      return jsonError("Could not save follow-up question", 500)
    }

    return NextResponse.json(publicResponse)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (isFollowUpQuestionTimeoutError(error) || isFollowUpQuestionOutputError(error)) {
      return jsonError("Could not generate question. Try again.", 502)
    }

    console.error("Generate follow-up question API error:", error)
    return jsonError("Internal server error", 500)
  }
}
