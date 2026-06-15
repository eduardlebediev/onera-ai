import "server-only"

import {
  INACTIVE_TEST_START_MESSAGE,
  isTestAssignable,
} from "@/features/tests/lib/test-source-validity-style"
import { createAdminClient } from "@/lib/supabase/admin"

import { getActiveAttempt, getCompletedAttemptCount } from "./attempt-queries"
import { getAssignmentForEmployee, isAssignmentTakeable } from "./supabase-employee-tests"
import {
  isMissingMaxAttemptsColumnError,
  warnMissingMaxAttemptsFallback,
} from "./supabase-schema-drift"
import type { StartAttemptResult, TestAttemptPolicyRow } from "./supabase-employee-attempts"

const TEST_ATTEMPT_POLICY_SELECT =
  "id, organization_id, status, is_active, source_validity, max_attempts"

const LEGACY_TEST_ATTEMPT_POLICY_SELECT = "id, organization_id, status, is_active, source_validity"

function normalizeTestAttemptPolicyRow(row: unknown | null): TestAttemptPolicyRow | null {
  if (!row) return null

  const test = row as Partial<TestAttemptPolicyRow>

  return {
    ...test,
    max_attempts: test.max_attempts ?? null,
  } as TestAttemptPolicyRow
}

async function getTestAttemptPolicyRow(input: {
  testId: string
  organizationId: string
}): Promise<TestAttemptPolicyRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select(TEST_ATTEMPT_POLICY_SELECT)
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (error && isMissingMaxAttemptsColumnError(error)) {
    warnMissingMaxAttemptsFallback()

    const { data: legacyData, error: legacyError } = await supabase
      .from("tests")
      .select(LEGACY_TEST_ATTEMPT_POLICY_SELECT)
      .eq("id", input.testId)
      .eq("organization_id", input.organizationId)
      .maybeSingle()

    if (legacyError) {
      throw new Error(`Failed to fetch test: ${legacyError.message}`)
    }

    return normalizeTestAttemptPolicyRow(legacyData)
  }

  if (error) {
    throw new Error(`Failed to fetch test: ${error.message}`)
  }

  return normalizeTestAttemptPolicyRow(data)
}

export type StartAttemptErrorCode =
  | "not_found"
  | "assignment_finished"
  | "test_inactive"
  | "max_attempts_reached"

export class StartAttemptError extends Error {
  constructor(
    message: string,
    public code: StartAttemptErrorCode
  ) {
    super(message)
    this.name = "StartAttemptError"
  }
}

export async function startEmployeeTestAttempt(
  testId: string,
  userId: string,
  organizationId: string
): Promise<StartAttemptResult | null> {
  const assignment = await getAssignmentForEmployee(testId, userId, organizationId)
  if (!assignment) return null

  if (assignment.status === "completed") {
    throw new StartAttemptError("Passed assignments cannot be retaken", "assignment_finished")
  }

  if (!isAssignmentTakeable(assignment.status) && assignment.status !== "failed") {
    return null
  }

  const supabase = createAdminClient()
  const testRow = await getTestAttemptPolicyRow({ testId, organizationId })
  if (!testRow || testRow.status !== "published") return null

  const isActive = testRow.is_active ?? true
  const sourceValidity = testRow.source_validity ?? "valid"

  if (
    !isTestAssignable({
      status: testRow.status,
      isActive,
      sourceValidity,
    })
  ) {
    throw new StartAttemptError(INACTIVE_TEST_START_MESSAGE, "test_inactive")
  }

  const existingAttempt = await getActiveAttempt(userId, testId)
  if (existingAttempt) {
    return { attemptId: existingAttempt.id, testId }
  }

  if (assignment.status === "failed") {
    const completedAttemptCount = await getCompletedAttemptCount({
      userId,
      testId,
      organizationId,
    })
    const maxAttempts = testRow.max_attempts ?? 3

    if (completedAttemptCount >= maxAttempts) {
      throw new StartAttemptError(
        `Maximum attempts reached (${maxAttempts}). Review your latest result instead.`,
        "max_attempts_reached"
      )
    }
  }

  if (assignment.status === "not_started" || assignment.status === "failed") {
    const { data: updatedAssignment, error: assignmentUpdateError } = await supabase
      .from("test_assignments")
      .update({ status: "in_progress" })
      .eq("id", assignment.id)
      .in("status", ["not_started", "failed"])
      .select("id")
      .maybeSingle()

    if (assignmentUpdateError) {
      throw new Error(`Failed to update assignment status: ${assignmentUpdateError.message}`)
    }

    if (!updatedAssignment) {
      const latestAssignment = await getAssignmentForEmployee(testId, userId, organizationId)

      if (!latestAssignment) {
        return null
      }

      if (latestAssignment.status === "completed") {
        throw new StartAttemptError("Passed assignments cannot be retaken", "assignment_finished")
      }

      if (!isAssignmentTakeable(latestAssignment.status) && latestAssignment.status !== "failed") {
        return null
      }
    }
  }

  const now = new Date().toISOString()

  const { data: newAttempt, error: insertError } = await supabase
    .from("test_attempts")
    .insert({
      organization_id: testRow.organization_id,
      test_id: testId,
      user_id: userId,
      assignment_id: assignment.id,
      status: "in_progress",
      started_at: now,
    })
    .select("id")
    .single()

  if (insertError) {
    const racedAttempt = await getActiveAttempt(userId, testId)
    if (racedAttempt) {
      return { attemptId: racedAttempt.id, testId }
    }

    throw new Error(`Failed to create test attempt: ${insertError.message}`)
  }

  return { attemptId: newAttempt.id, testId }
}
