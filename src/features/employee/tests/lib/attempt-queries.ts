import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import type { AttemptRow } from "./supabase-employee-attempts"

export async function getActiveAttempt(userId: string, testId: string): Promise<AttemptRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select(
      "id, organization_id, test_id, user_id, assignment_id, status, score, passed, ai_feedback, started_at, completed_at"
    )
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch active attempt: ${error.message}`)
  }

  return data as AttemptRow | null
}

export async function getCompletedAttemptCount(input: {
  userId: string
  testId: string
  organizationId: string
}): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from("test_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("test_id", input.testId)
    .eq("organization_id", input.organizationId)
    .eq("status", "completed")

  if (error) {
    throw new Error(`Failed to count completed attempts: ${error.message}`)
  }

  return count ?? 0
}

export async function getAttemptById(attemptId: string): Promise<AttemptRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("test_attempts")
    .select(
      "id, organization_id, test_id, user_id, assignment_id, status, score, passed, ai_feedback, started_at, completed_at"
    )
    .eq("id", attemptId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch attempt: ${error.message}`)
  }

  return data as AttemptRow | null
}
