import "server-only"

import type { TestResultsSummary } from "@/features/tests/mock/tests"
import type { TestAssignmentStatus } from "@/features/tests/mock/employees"
import { createAdminClient } from "@/lib/supabase/admin"

export type SupabaseEmployeeProgress = {
  assignmentId: string
  userId: string
  name: string
  email: string
  assignmentStatus: TestAssignmentStatus
  deadline: string | null
  attemptStatus: "in_progress" | "completed" | "abandoned" | null
  score: number | null
  passed: boolean | null
  completedAt: string | null
  resultLabel: string
}

export type SupabaseTestProgress = {
  employees: SupabaseEmployeeProgress[]
  results: TestResultsSummary
}

type AssignmentRow = {
  id: string
  user_id: string
  status: string
  deadline: string | null
}

type AttemptRow = {
  id: string
  user_id: string
  assignment_id: string | null
  status: string
  score: number | null
  passed: boolean | null
  completed_at: string | null
  created_at: string
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
}

type AnswerRow = {
  question_id: string
  is_correct: boolean | null
}

type QuestionTopicRow = {
  id: string
  topic: string | null
}

function isAssignmentStatus(status: string): status is TestAssignmentStatus {
  return (
    status === "not_started" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "failed"
  )
}

function mapAssignmentStatus(status: string): TestAssignmentStatus {
  return isAssignmentStatus(status) ? status : "not_started"
}

function isAttemptStatus(status: string): status is "in_progress" | "completed" | "abandoned" {
  return status === "in_progress" || status === "completed" || status === "abandoned"
}

function profileDisplayName(profile: ProfileRow | undefined): string {
  return profile?.full_name ?? profile?.email ?? "Employee"
}

function resolveResultLabel(input: {
  assignmentStatus: TestAssignmentStatus
  attemptStatus: "in_progress" | "completed" | "abandoned" | null
  passed: boolean | null
}): string {
  if (input.attemptStatus === "completed" && input.passed !== null) {
    return input.passed ? "Passed" : "Failed"
  }

  if (input.assignmentStatus === "completed") {
    return "Completed"
  }

  if (input.assignmentStatus === "failed") {
    return "Failed"
  }

  if (input.attemptStatus === "in_progress") {
    return "In progress"
  }

  if (input.attemptStatus === "abandoned") {
    return "Abandoned"
  }

  return "—"
}

function pickLatestAttemptForUser(attempts: AttemptRow[], userId: string): AttemptRow | null {
  const userAttempts = attempts.filter((attempt) => attempt.user_id === userId)
  if (userAttempts.length === 0) return null

  const completed = userAttempts
    .filter((attempt) => attempt.status === "completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))[0]

  if (completed) return completed

  const inProgress = userAttempts.find((attempt) => attempt.status === "in_progress")
  if (inProgress) return inProgress

  return userAttempts.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
}

function buildWeakTopics(
  answers: AnswerRow[],
  questions: QuestionTopicRow[]
): TestResultsSummary["weakTopics"] {
  const questionsById = new Map(questions.map((question) => [question.id, question]))
  const topicTotals = new Map<string, number>()
  const topicWrong = new Map<string, number>()

  for (const answer of answers) {
    const question = questionsById.get(answer.question_id)
    if (!question) continue

    const topic = question.topic ?? "General"
    topicTotals.set(topic, (topicTotals.get(topic) ?? 0) + 1)

    if (answer.is_correct === false) {
      topicWrong.set(topic, (topicWrong.get(topic) ?? 0) + 1)
    }
  }

  return Array.from(topicWrong.entries())
    .map(([topic, wrongCount]) => {
      const totalAnswersForTopic = topicTotals.get(topic) ?? wrongCount
      const correctCount = totalAnswersForTopic - wrongCount
      const correctnessPct =
        totalAnswersForTopic > 0 ? Math.round((correctCount / totalAnswersForTopic) * 100) : 0

      return { topic, correctnessPct }
    })
    .sort((a, b) => a.correctnessPct - b.correctnessPct)
}

export async function getSupabaseTestProgress(
  testId: string,
  organizationId: string
): Promise<SupabaseTestProgress> {
  if (!organizationId) {
    throw new Error("Test progress requires an organization scope")
  }

  const supabase = createAdminClient()

  const [
    { data: assignments, error: assignmentsError },
    { data: attempts, error: attemptsError },
    { data: questions, error: questionsError },
  ] = await Promise.all([
    supabase
      .from("test_assignments")
      .select("id, user_id, status, deadline")
      .eq("organization_id", organizationId)
      .eq("test_id", testId)
      .order("created_at", { ascending: false }),
    supabase
      .from("test_attempts")
      .select("id, user_id, assignment_id, status, score, passed, completed_at, created_at")
      .eq("organization_id", organizationId)
      .eq("test_id", testId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("test_questions")
      .select("id, topic")
      .eq("organization_id", organizationId)
      .eq("test_id", testId),
  ])

  if (assignmentsError || attemptsError || questionsError) {
    throw new Error(
      assignmentsError?.message ??
        attemptsError?.message ??
        questionsError?.message ??
        "Unknown error"
    )
  }

  const assignmentRows = (assignments ?? []) as AssignmentRow[]
  const attemptRows = (attempts ?? []) as AttemptRow[]
  const questionRows = (questions ?? []) as QuestionTopicRow[]

  const profileIds = Array.from(
    new Set([
      ...assignmentRows.map((assignment) => assignment.user_id),
      ...attemptRows.map((attempt) => attempt.user_id),
    ])
  )

  const profilesById = new Map<string, ProfileRow>()

  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", profileIds)

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profilesById.set(profile.id, profile)
    }
  }

  const completedAttempts = attemptRows.filter(
    (attempt) => attempt.status === "completed" && attempt.score !== null && attempt.passed !== null
  )

  const attemptIds = attemptRows.map((attempt) => attempt.id)
  let answerRows: AnswerRow[] = []

  if (attemptIds.length > 0) {
    const { data: answers, error: answersError } = await supabase
      .from("test_answers")
      .select("question_id, is_correct")
      .eq("organization_id", organizationId)
      .in("attempt_id", attemptIds)

    if (answersError) {
      throw new Error(`Failed to fetch test answers: ${answersError.message}`)
    }

    answerRows = (answers ?? []) as AnswerRow[]
  }

  const employees: SupabaseEmployeeProgress[] = assignmentRows.map((assignment) => {
    const profile = profilesById.get(assignment.user_id)
    const assignmentStatus = mapAssignmentStatus(assignment.status)
    const latestAttempt = pickLatestAttemptForUser(attemptRows, assignment.user_id)
    const attemptStatus =
      latestAttempt && isAttemptStatus(latestAttempt.status) ? latestAttempt.status : null

    return {
      assignmentId: assignment.id,
      userId: assignment.user_id,
      name: profileDisplayName(profile),
      email: profile?.email ?? "No email",
      assignmentStatus,
      deadline: assignment.deadline,
      attemptStatus,
      score: latestAttempt?.score ?? null,
      passed: latestAttempt?.passed ?? null,
      completedAt: latestAttempt?.completed_at ?? null,
      resultLabel: resolveResultLabel({
        assignmentStatus,
        attemptStatus,
        passed: latestAttempt?.passed ?? null,
      }),
    }
  })

  const averageScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
            completedAttempts.length
        )
      : 0

  const passRate =
    completedAttempts.length > 0
      ? Math.round(
          (completedAttempts.filter((attempt) => attempt.passed).length /
            completedAttempts.length) *
            100
        )
      : 0

  const recentAttempts: TestResultsSummary["recentAttempts"] = completedAttempts
    .slice(0, 5)
    .map((attempt) => ({
      id: attempt.id,
      employeeName: profileDisplayName(profilesById.get(attempt.user_id)),
      score: attempt.score ?? 0,
      passed: attempt.passed ?? false,
      completedAt: attempt.completed_at ?? new Date().toISOString(),
    }))

  return {
    employees,
    results: {
      averageScore,
      passRate,
      weakTopics: buildWeakTopics(answerRows, questionRows),
      recentAttempts,
    },
  }
}
