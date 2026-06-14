import { NextResponse } from "next/server"

import { AuthError, requireEmployeeApiUser } from "@/features/auth/lib/require-auth"
import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import {
  getFollowUpAnswerByQuestionId,
  insertFollowUpAnswer,
  mapFollowUpQuestionRowToFollowUp,
} from "@/features/employee/tests/lib/supabase-employee-follow-ups"
import {
  FollowUpAnswerResultSchema,
  SubmitFollowUpAnswerRequestSchema,
} from "@/features/employee/tests/schemas/follow-up-question-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

interface SubmitFollowUpAnswerRouteContext {
  params: Promise<{ id: string; followUpId: string }>
}

type FollowUpQuestionRow = {
  id: string
  organization_id: string
  attempt_id: string
  original_question_id: string
  question_text: string
  options: Json
  correct_answer: Json
  topic: string
  explanation_before_question: string
  explanation_after_answer: string
  learning_goal: string
  difficulty: string
  source_chunk_reference: string
}

type AttemptRow = {
  id: string
  test_id: string
  user_id: string
  organization_id: string
  status: string
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function parseCorrectOptionId(value: Json): string | null {
  if (typeof value !== "object" || value === null) return null

  const record = value as Record<string, unknown>
  return typeof record.optionId === "string" ? record.optionId : null
}

function buildAnswerResult(followUp: FollowUpQuestionRow, isCorrect: boolean) {
  const correctOptionId = parseCorrectOptionId(followUp.correct_answer)

  if (!correctOptionId) {
    return null
  }

  return FollowUpAnswerResultSchema.parse({
    isCorrect,
    correctOptionId,
    explanationAfterAnswer: followUp.explanation_after_answer,
  })
}

export async function POST(request: Request, { params }: SubmitFollowUpAnswerRouteContext) {
  try {
    const employee = await requireEmployeeApiUser()
    const { id: testId, followUpId } = await params

    if (!isUuid(testId)) {
      if (isMockTestId(testId)) {
        return jsonError("Mock tests use the local demo follow-up flow", 404)
      }

      return jsonError("Invalid test id", 400)
    }

    if (!isUuid(followUpId)) {
      return jsonError("Invalid follow-up id", 400)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = SubmitFollowUpAnswerRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const organizationId = employee.membership.organizationId
    const supabase = createAdminClient()

    const { data: followUp, error: followUpError } = await supabase
      .from("follow_up_questions")
      .select(
        "id, organization_id, attempt_id, original_question_id, question_text, options, correct_answer, topic, explanation_before_question, explanation_after_answer, learning_goal, difficulty, source_chunk_reference"
      )
      .eq("id", followUpId)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (followUpError) {
      throw new Error(`Failed to fetch follow-up question: ${followUpError.message}`)
    }

    const followUpRow = followUp as FollowUpQuestionRow | null

    if (!followUpRow) {
      return jsonError("Follow-up question not found", 404)
    }

    const { data: attempt, error: attemptError } = await supabase
      .from("test_attempts")
      .select("id, test_id, user_id, organization_id, status")
      .eq("id", followUpRow.attempt_id)
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

    const existingAnswer = await getFollowUpAnswerByQuestionId(followUpId, organizationId)

    if (existingAnswer) {
      const result = buildAnswerResult(followUpRow, existingAnswer.is_correct)

      if (!result) {
        return jsonError("Stored follow-up answer is invalid", 500)
      }

      return NextResponse.json(result)
    }

    const followUpQuestion = mapFollowUpQuestionRowToFollowUp(followUpRow, true)
    const validOptionIds = new Set(followUpQuestion.options.map((option) => option.id))
    const { selectedOptionId } = parsedRequest.data

    if (!validOptionIds.has(selectedOptionId)) {
      return jsonError("Selected option is invalid", 400)
    }

    const correctOptionId = followUpQuestion.correctOptionId

    if (!correctOptionId) {
      return jsonError("Follow-up question is missing a correct answer", 500)
    }

    const isCorrect = selectedOptionId === correctOptionId

    try {
      await insertFollowUpAnswer({
        organizationId,
        followUpQuestionId: followUpId,
        selectedOptionId,
        isCorrect,
      })
    } catch (insertError) {
      const existingAfterRace = await getFollowUpAnswerByQuestionId(followUpId, organizationId)

      if (existingAfterRace) {
        const racedResult = buildAnswerResult(followUpRow, existingAfterRace.is_correct)

        if (!racedResult) {
          return jsonError("Stored follow-up answer is invalid", 500)
        }

        return NextResponse.json(racedResult)
      }

      throw insertError
    }

    const result = buildAnswerResult(followUpRow, isCorrect)

    if (!result) {
      return jsonError("Could not build follow-up answer result", 500)
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Submit follow-up answer API error:", error)
    return jsonError("Internal server error", 500)
  }
}
