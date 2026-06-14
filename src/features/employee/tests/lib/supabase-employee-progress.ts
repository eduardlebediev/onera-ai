import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

type CompletedAttemptRow = {
  id: string
  test_id: string
  score: number | null
  passed: boolean | null
  completed_at: string | null
}

type TestTitleRow = {
  id: string
  title: string
}

type AnswerTopicRow = {
  attempt_id: string
  question_id: string
  is_correct: boolean | null
}

type QuestionTopicRow = {
  id: string
  topic: string | null
}

export type EmployeeProgressTopic = {
  topic: string
  correctCount: number
  totalCount: number
  correctPercent: number
}

export type EmployeeProgressAttempt = {
  attemptId: string
  testId: string
  testTitle: string
  score: number | null
  passed: boolean | null
  completedAt: string | null
}

export type EmployeeCompletedAttemptStats = {
  completedTestsCount: number
  averageScore: number
}

export type EmployeeProgress = EmployeeCompletedAttemptStats & {
  strengths: EmployeeProgressTopic[]
  weakTopics: EmployeeProgressTopic[]
  attempts: EmployeeProgressAttempt[]
}

function buildCompletedAttemptStats(
  attempts: Pick<CompletedAttemptRow, "score">[]
): EmployeeCompletedAttemptStats {
  const scoredAttempts = attempts.filter((attempt) => attempt.score !== null)
  const averageScore =
    scoredAttempts.length === 0
      ? 0
      : Math.round(
          scoredAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
            scoredAttempts.length
        )

  return {
    completedTestsCount: attempts.length,
    averageScore,
  }
}

async function getCompletedAttemptRows(
  userId: string,
  organizationId: string
): Promise<CompletedAttemptRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, test_id, score, passed, completed_at")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch employee progress attempts: ${error.message}`)
  }

  return (data ?? []) as CompletedAttemptRow[]
}

async function getTestTitlesById(
  testIds: string[],
  organizationId: string
): Promise<Map<string, string>> {
  if (testIds.length === 0) return new Map()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select("id, title")
    .eq("organization_id", organizationId)
    .in("id", testIds)

  if (error) {
    throw new Error(`Failed to fetch employee progress test titles: ${error.message}`)
  }

  return new Map(((data ?? []) as TestTitleRow[]).map((test) => [test.id, test.title]))
}

async function getAnswerRowsForAttempts(
  attemptIds: string[],
  organizationId: string
): Promise<AnswerTopicRow[]> {
  if (attemptIds.length === 0) return []

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_answers")
    .select("attempt_id, question_id, is_correct")
    .eq("organization_id", organizationId)
    .in("attempt_id", attemptIds)

  if (error) {
    throw new Error(`Failed to fetch employee progress answers: ${error.message}`)
  }

  return (data ?? []) as AnswerTopicRow[]
}

async function getQuestionTopicsById(
  questionIds: string[],
  organizationId: string
): Promise<Map<string, string>> {
  if (questionIds.length === 0) return new Map()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_questions")
    .select("id, topic")
    .eq("organization_id", organizationId)
    .in("id", questionIds)

  if (error) {
    throw new Error(`Failed to fetch employee progress question topics: ${error.message}`)
  }

  return new Map(
    ((data ?? []) as QuestionTopicRow[]).map((question) => [
      question.id,
      question.topic?.trim() || "General",
    ])
  )
}

function buildTopicPerformance(
  answerRows: AnswerTopicRow[],
  topicsByQuestionId: Map<string, string>
): EmployeeProgressTopic[] {
  const topicStats = new Map<string, { correctCount: number; totalCount: number }>()

  for (const answer of answerRows) {
    const topic = topicsByQuestionId.get(answer.question_id)
    if (!topic) continue

    const existing = topicStats.get(topic) ?? { correctCount: 0, totalCount: 0 }
    existing.totalCount += 1
    if (answer.is_correct === true) {
      existing.correctCount += 1
    }
    topicStats.set(topic, existing)
  }

  return Array.from(topicStats.entries()).map(([topic, stats]) => ({
    topic,
    correctCount: stats.correctCount,
    totalCount: stats.totalCount,
    correctPercent: Math.round((stats.correctCount / stats.totalCount) * 100),
  }))
}

function sortStrongTopics(a: EmployeeProgressTopic, b: EmployeeProgressTopic): number {
  return (
    b.correctPercent - a.correctPercent ||
    b.totalCount - a.totalCount ||
    a.topic.localeCompare(b.topic)
  )
}

function sortWeakTopics(a: EmployeeProgressTopic, b: EmployeeProgressTopic): number {
  return (
    a.correctPercent - b.correctPercent ||
    b.totalCount - a.totalCount ||
    a.topic.localeCompare(b.topic)
  )
}

export async function getEmployeeCompletedAttemptStats(
  userId: string,
  organizationId: string
): Promise<EmployeeCompletedAttemptStats> {
  const attempts = await getCompletedAttemptRows(userId, organizationId)
  return buildCompletedAttemptStats(attempts)
}

export async function getSupabaseEmployeeProgress(
  userId: string,
  organizationId: string
): Promise<EmployeeProgress> {
  const attempts = await getCompletedAttemptRows(userId, organizationId)
  const stats = buildCompletedAttemptStats(attempts)

  if (attempts.length === 0) {
    return {
      ...stats,
      strengths: [],
      weakTopics: [],
      attempts: [],
    }
  }

  const attemptIds = attempts.map((attempt) => attempt.id)
  const testIds = Array.from(new Set(attempts.map((attempt) => attempt.test_id)))
  const [testTitlesById, answerRows] = await Promise.all([
    getTestTitlesById(testIds, organizationId),
    getAnswerRowsForAttempts(attemptIds, organizationId),
  ])
  const questionIds = Array.from(new Set(answerRows.map((answer) => answer.question_id)))
  const topicsByQuestionId = await getQuestionTopicsById(questionIds, organizationId)
  const topicPerformance = buildTopicPerformance(answerRows, topicsByQuestionId)

  return {
    ...stats,
    strengths: topicPerformance.filter((topic) => topic.correctPercent > 80).sort(sortStrongTopics),
    weakTopics: topicPerformance.filter((topic) => topic.correctPercent < 60).sort(sortWeakTopics),
    attempts: attempts.map((attempt) => ({
      attemptId: attempt.id,
      testId: attempt.test_id,
      testTitle: testTitlesById.get(attempt.test_id) ?? "Untitled test",
      score: attempt.score,
      passed: attempt.passed,
      completedAt: attempt.completed_at,
    })),
  }
}
