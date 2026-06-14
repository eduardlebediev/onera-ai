import "server-only"

import type { FollowUpQuestionOutput } from "@/features/employee/tests/schemas/follow-up-question-schema"
import type { FollowUpQuestion } from "@/features/employee/tests/mock/follow-up-questions"
import type { Json } from "@/lib/supabase/types"
import { createAdminClient } from "@/lib/supabase/admin"

export type PersistedFollowUpAnswer = {
  selectedOptionId: string
  isCorrect: boolean
}

export type PersistedFollowUpState = {
  followUp: FollowUpQuestion
  submittedAnswer?: PersistedFollowUpAnswer
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

type FollowUpAnswerRow = {
  id: string
  follow_up_question_id: string
  user_answer: Json
  is_correct: boolean
}

function parseFollowUpOptions(value: Json): FollowUpQuestion["options"] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "label" in item &&
      typeof item.id === "string" &&
      typeof item.label === "string"
    ) {
      return [{ id: item.id, label: item.label }]
    }

    return []
  })
}

function parseCorrectOptionId(value: Json): string | null {
  if (typeof value !== "object" || value === null) return null

  const record = value as Record<string, unknown>
  return typeof record.optionId === "string" ? record.optionId : null
}

function parseSelectedOptionId(value: Json): string | null {
  if (typeof value !== "object" || value === null) return null

  const record = value as Record<string, unknown>
  return typeof record.selectedOptionId === "string" ? record.selectedOptionId : null
}

export function mapFollowUpQuestionRowToFollowUp(
  row: FollowUpQuestionRow,
  includeCorrectAnswer: boolean
): FollowUpQuestion {
  const correctOptionId = parseCorrectOptionId(row.correct_answer) ?? "opt-a"

  return {
    id: row.id,
    originalQuestionId: row.original_question_id,
    topic: row.topic,
    sourceChunkReference: row.source_chunk_reference,
    explanationBeforeQuestion: row.explanation_before_question,
    questionText: row.question_text,
    options: parseFollowUpOptions(row.options),
    ...(includeCorrectAnswer ? { correctOptionId } : {}),
    explanationAfterAnswer: row.explanation_after_answer,
    learningGoal: row.learning_goal,
    difficulty: row.difficulty === "easy" || row.difficulty === "hard" ? row.difficulty : "medium",
  }
}

export function stripCorrectAnswerFromFollowUp(
  followUp: FollowUpQuestionOutput | FollowUpQuestion
): Omit<FollowUpQuestion, "correctOptionId"> {
  const { correctOptionId, ...publicFollowUp } = followUp
  void correctOptionId
  return publicFollowUp
}

export function buildFollowUpQuestionInsert(input: {
  organizationId: string
  attemptId: string
  originalQuestionId: string
  generated: FollowUpQuestionOutput
  sourceChunkReference: string
}) {
  return {
    organization_id: input.organizationId,
    attempt_id: input.attemptId,
    original_question_id: input.originalQuestionId,
    question_text: input.generated.questionText,
    options: input.generated.options as unknown as Json,
    correct_answer: { optionId: input.generated.correctOptionId } satisfies Json,
    topic: input.generated.topic,
    explanation_before_question: input.generated.explanationBeforeQuestion,
    explanation_after_answer: input.generated.explanationAfterAnswer,
    learning_goal: input.generated.learningGoal,
    difficulty: input.generated.difficulty,
    source_chunk_reference: input.sourceChunkReference,
  }
}

export async function getFollowUpQuestionByAttemptAndOriginalQuestion(input: {
  attemptId: string
  originalQuestionId: string
  organizationId: string
}): Promise<FollowUpQuestionRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("follow_up_questions")
    .select(
      "id, organization_id, attempt_id, original_question_id, question_text, options, correct_answer, topic, explanation_before_question, explanation_after_answer, learning_goal, difficulty, source_chunk_reference"
    )
    .eq("attempt_id", input.attemptId)
    .eq("original_question_id", input.originalQuestionId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch follow-up question: ${error.message}`)
  }

  return (data as FollowUpQuestionRow | null) ?? null
}

export async function insertFollowUpQuestion(input: {
  organizationId: string
  attemptId: string
  originalQuestionId: string
  generated: FollowUpQuestionOutput
  sourceChunkReference: string
}): Promise<FollowUpQuestionRow> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("follow_up_questions")
    .insert(buildFollowUpQuestionInsert(input))
    .select(
      "id, organization_id, attempt_id, original_question_id, question_text, options, correct_answer, topic, explanation_before_question, explanation_after_answer, learning_goal, difficulty, source_chunk_reference"
    )
    .single()

  if (error || !data) {
    if (error?.code === "23505") {
      const existing = await getFollowUpQuestionByAttemptAndOriginalQuestion({
        attemptId: input.attemptId,
        originalQuestionId: input.originalQuestionId,
        organizationId: input.organizationId,
      })

      if (existing) {
        return existing
      }
    }

    throw new Error(`Failed to persist follow-up question: ${error?.message ?? "unknown error"}`)
  }

  return data as FollowUpQuestionRow
}

export async function getFollowUpAnswerByQuestionId(
  followUpQuestionId: string,
  organizationId: string
): Promise<FollowUpAnswerRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("follow_up_answers")
    .select("id, follow_up_question_id, user_answer, is_correct")
    .eq("follow_up_question_id", followUpQuestionId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch follow-up answer: ${error.message}`)
  }

  return (data as FollowUpAnswerRow | null) ?? null
}

export async function insertFollowUpAnswer(input: {
  organizationId: string
  followUpQuestionId: string
  selectedOptionId: string
  isCorrect: boolean
}): Promise<FollowUpAnswerRow> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("follow_up_answers")
    .insert({
      organization_id: input.organizationId,
      follow_up_question_id: input.followUpQuestionId,
      user_answer: { selectedOptionId: input.selectedOptionId } satisfies Json,
      is_correct: input.isCorrect,
    })
    .select("id, follow_up_question_id, user_answer, is_correct")
    .single()

  if (error || !data) {
    throw new Error(`Failed to persist follow-up answer: ${error?.message ?? "unknown error"}`)
  }

  return data as FollowUpAnswerRow
}

export async function getPersistedFollowUpsForAttempt(
  attemptId: string,
  organizationId: string
): Promise<Record<string, PersistedFollowUpState>> {
  const supabase = createAdminClient()

  const { data: questionRows, error: questionsError } = await supabase
    .from("follow_up_questions")
    .select(
      "id, organization_id, attempt_id, original_question_id, question_text, options, correct_answer, topic, explanation_before_question, explanation_after_answer, learning_goal, difficulty, source_chunk_reference"
    )
    .eq("attempt_id", attemptId)
    .eq("organization_id", organizationId)

  if (questionsError) {
    throw new Error(`Failed to fetch follow-up questions: ${questionsError.message}`)
  }

  const rows = (questionRows ?? []) as FollowUpQuestionRow[]
  if (rows.length === 0) {
    return {}
  }

  const followUpIds = rows.map((row) => row.id)

  const { data: answerRows, error: answersError } = await supabase
    .from("follow_up_answers")
    .select("id, follow_up_question_id, user_answer, is_correct")
    .in("follow_up_question_id", followUpIds)
    .eq("organization_id", organizationId)

  if (answersError) {
    throw new Error(`Failed to fetch follow-up answers: ${answersError.message}`)
  }

  const answersByQuestionId = new Map(
    ((answerRows ?? []) as FollowUpAnswerRow[]).map((row) => [row.follow_up_question_id, row])
  )

  return Object.fromEntries(
    rows.map((row) => {
      const answerRow = answersByQuestionId.get(row.id)
      const selectedOptionId = answerRow ? parseSelectedOptionId(answerRow.user_answer) : null

      return [
        row.original_question_id,
        {
          followUp: mapFollowUpQuestionRowToFollowUp(row, Boolean(answerRow)),
          submittedAnswer:
            answerRow && selectedOptionId
              ? {
                  selectedOptionId,
                  isCorrect: answerRow.is_correct,
                }
              : undefined,
        } satisfies PersistedFollowUpState,
      ]
    })
  )
}
