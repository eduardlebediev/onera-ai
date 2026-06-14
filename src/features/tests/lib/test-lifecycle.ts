import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import type { TestMetadataUpdateRequest } from "../schemas/test-lifecycle-schema"

export type TestLifecycleImpact = {
  assignmentCount: number
  activeAssignmentCount: number
  attemptCount: number
  completedAttemptCount: number
}

export type TestLifecycleResult = {
  testId: string
  status: string
  isActive: boolean
  impact: TestLifecycleImpact
}

export type DeleteTestResult = TestLifecycleResult & {
  deleteMode: "hard_deleted" | "tombstoned"
}

type LifecycleTestRow = {
  id: string
  organization_id: string
  status: string
  is_active: boolean
  source_validity: string
}

type SupabaseLikeError = {
  code?: string
  message?: string
}

export type TestLifecycleErrorCode =
  | "not_found"
  | "invalid_status"
  | "attempts_exist"
  | "migration_required"

export class TestLifecycleError extends Error {
  constructor(
    message: string,
    public code: TestLifecycleErrorCode
  ) {
    super(message)
    this.name = "TestLifecycleError"
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as SupabaseLikeError).message
    return typeof message === "string" ? message : ""
  }

  return ""
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as SupabaseLikeError).code
    return typeof code === "string" ? code : undefined
  }

  return undefined
}

function isTestLifecycleMigrationError(error: unknown): boolean {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  if (code === "42703" || code === "PGRST204") {
    return true
  }

  return (
    ["deleted_at", "deleted_by", "deletion_reason"].some((column) => message.includes(column)) &&
    (message.includes("does not exist") || message.includes("schema cache"))
  )
}

async function getLifecycleTest(
  testId: string,
  organizationId: string
): Promise<LifecycleTestRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select("id, organization_id, status, is_active, source_validity")
    .eq("id", testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch test: ${error.message}`)
  }

  return data as LifecycleTestRow | null
}

export async function getTestLifecycleImpact(input: {
  testId: string
  organizationId: string
}): Promise<TestLifecycleImpact> {
  const supabase = createAdminClient()

  const [
    { count: assignmentCount, error: assignmentError },
    { count: activeAssignmentCount, error: activeAssignmentError },
    { count: attemptCount, error: attemptError },
    { count: completedAttemptCount, error: completedAttemptError },
  ] = await Promise.all([
    supabase
      .from("test_assignments")
      .select("id", { count: "exact", head: true })
      .eq("test_id", input.testId)
      .eq("organization_id", input.organizationId),
    supabase
      .from("test_assignments")
      .select("id", { count: "exact", head: true })
      .eq("test_id", input.testId)
      .eq("organization_id", input.organizationId)
      .in("status", ["not_started", "in_progress"]),
    supabase
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("test_id", input.testId)
      .eq("organization_id", input.organizationId),
    supabase
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("test_id", input.testId)
      .eq("organization_id", input.organizationId)
      .eq("status", "completed"),
  ])

  if (assignmentError) {
    throw new Error(`Failed to count assignments: ${assignmentError.message}`)
  }
  if (activeAssignmentError) {
    throw new Error(`Failed to count active assignments: ${activeAssignmentError.message}`)
  }
  if (attemptError) {
    throw new Error(`Failed to count attempts: ${attemptError.message}`)
  }
  if (completedAttemptError) {
    throw new Error(`Failed to count completed attempts: ${completedAttemptError.message}`)
  }

  return {
    assignmentCount: assignmentCount ?? 0,
    activeAssignmentCount: activeAssignmentCount ?? 0,
    attemptCount: attemptCount ?? 0,
    completedAttemptCount: completedAttemptCount ?? 0,
  }
}

export async function updateTestMetadata(input: {
  testId: string
  organizationId: string
  metadata: TestMetadataUpdateRequest
}): Promise<TestLifecycleResult> {
  const test = await getLifecycleTest(input.testId, input.organizationId)

  if (!test || test.status === "deleted") {
    throw new TestLifecycleError("Test not found", "not_found")
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("tests")
    .update({
      title: input.metadata.title,
      description: input.metadata.description ?? null,
      difficulty: input.metadata.difficulty,
      passing_score: input.metadata.passingScore,
      target_role: input.metadata.targetRole?.trim() || null,
    })
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)

  if (error) {
    throw new Error(`Failed to update test metadata: ${error.message}`)
  }

  return {
    testId: test.id,
    status: test.status,
    isActive: test.is_active ?? true,
    impact: await getTestLifecycleImpact(input),
  }
}

export async function archiveTest(input: {
  testId: string
  organizationId: string
}): Promise<TestLifecycleResult> {
  const test = await getLifecycleTest(input.testId, input.organizationId)

  if (!test || test.status === "deleted") {
    throw new TestLifecycleError("Test not found", "not_found")
  }

  const impact = await getTestLifecycleImpact(input)

  if (test.status === "archived") {
    return {
      testId: test.id,
      status: "archived",
      isActive: false,
      impact,
    }
  }

  if (test.status !== "published") {
    throw new TestLifecycleError("Only published tests can be archived", "invalid_status")
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("tests")
    .update({ status: "archived", is_active: false })
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)

  if (error) {
    throw new Error(`Failed to archive test: ${error.message}`)
  }

  return {
    testId: test.id,
    status: "archived",
    isActive: false,
    impact,
  }
}

export async function restoreTest(input: {
  testId: string
  organizationId: string
}): Promise<TestLifecycleResult> {
  const test = await getLifecycleTest(input.testId, input.organizationId)

  if (!test || test.status === "deleted") {
    throw new TestLifecycleError("Test not found", "not_found")
  }

  const impact = await getTestLifecycleImpact(input)

  if (test.status === "published") {
    return {
      testId: test.id,
      status: "published",
      isActive: test.is_active ?? true,
      impact,
    }
  }

  if (test.status !== "archived") {
    throw new TestLifecycleError("Only archived tests can be restored", "invalid_status")
  }

  const supabase = createAdminClient()
  const restoredIsActive = test.source_validity === "valid" || test.source_validity === "outdated"

  const { error } = await supabase
    .from("tests")
    .update({ status: "published", is_active: restoredIsActive })
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)

  if (error) {
    throw new Error(`Failed to restore test: ${error.message}`)
  }

  return {
    testId: test.id,
    status: "published",
    isActive: restoredIsActive,
    impact,
  }
}

export async function deleteTest(input: {
  testId: string
  organizationId: string
  deletedBy: string
  deletionReason?: string
}): Promise<DeleteTestResult> {
  const test = await getLifecycleTest(input.testId, input.organizationId)

  if (!test || test.status === "deleted") {
    throw new TestLifecycleError("Test not found", "not_found")
  }

  const impact = await getTestLifecycleImpact(input)

  if (test.status === "published") {
    throw new TestLifecycleError(
      "Published tests cannot be deleted. Archive the test before deleting it.",
      "attempts_exist"
    )
  }

  if (test.status !== "draft" && test.status !== "review" && test.status !== "archived") {
    throw new TestLifecycleError("This test cannot be deleted", "invalid_status")
  }

  if (test.status !== "archived" && impact.attemptCount > 0) {
    throw new TestLifecycleError("Tests with attempts cannot be hard-deleted", "attempts_exist")
  }

  const supabase = createAdminClient()

  if (test.status === "archived" && impact.attemptCount > 0) {
    const { error } = await supabase
      .from("tests")
      .update({
        status: "deleted",
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: input.deletedBy,
        deletion_reason: input.deletionReason?.trim() || null,
      })
      .eq("id", input.testId)
      .eq("organization_id", input.organizationId)

    if (error) {
      if (isTestLifecycleMigrationError(error)) {
        throw new TestLifecycleError(
          "Test deletion tombstones require migration 00010_test_lifecycle_tombstones.sql.",
          "migration_required"
        )
      }

      throw new Error(`Failed to tombstone test: ${error.message}`)
    }

    return {
      testId: test.id,
      status: "deleted",
      isActive: false,
      impact,
      deleteMode: "tombstoned",
    }
  }

  const { error } = await supabase
    .from("tests")
    .delete()
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)

  if (error) {
    throw new Error(`Failed to delete test: ${error.message}`)
  }

  return {
    testId: test.id,
    status: "deleted",
    isActive: false,
    impact,
    deleteMode: "hard_deleted",
  }
}
