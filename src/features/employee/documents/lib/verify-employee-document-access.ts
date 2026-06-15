import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"

type AdminClient = SupabaseClient<Database>

async function isDocumentLinkedToTest(
  supabase: AdminClient,
  input: {
    testId: string
    documentId: string
    organizationId: string
  }
): Promise<boolean> {
  const { data: testDocument, error: testDocumentError } = await supabase
    .from("test_documents")
    .select("test_id")
    .eq("test_id", input.testId)
    .eq("document_id", input.documentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (testDocumentError) {
    throw new Error(`Failed to verify test document link: ${testDocumentError.message}`)
  }

  if (testDocument) {
    return true
  }

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id")
    .eq("id", input.testId)
    .eq("organization_id", input.organizationId)
    .eq("source_document_id", input.documentId)
    .maybeSingle()

  if (testError) {
    throw new Error(`Failed to verify test source document: ${testError.message}`)
  }

  return Boolean(test)
}

async function employeeHasTestAccess(
  supabase: AdminClient,
  input: {
    userId: string
    organizationId: string
    testId: string
  }
): Promise<boolean> {
  const { data: assignment, error: assignmentError } = await supabase
    .from("test_assignments")
    .select("id")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)
    .eq("test_id", input.testId)
    .maybeSingle()

  if (assignmentError) {
    throw new Error(`Failed to verify test assignment: ${assignmentError.message}`)
  }

  if (assignment) {
    return true
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("id")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)
    .eq("test_id", input.testId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle()

  if (attemptError) {
    throw new Error(`Failed to verify completed attempt: ${attemptError.message}`)
  }

  return Boolean(attempt)
}

export async function verifyEmployeeCanAccessDocument(input: {
  userId: string
  organizationId: string
  documentId: string
  testId?: string
}): Promise<boolean> {
  const supabase = createAdminClient()

  if (input.testId) {
    const linked = await isDocumentLinkedToTest(supabase, {
      testId: input.testId,
      documentId: input.documentId,
      organizationId: input.organizationId,
    })

    if (!linked) {
      return false
    }

    return employeeHasTestAccess(supabase, {
      userId: input.userId,
      organizationId: input.organizationId,
      testId: input.testId,
    })
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("test_assignments")
    .select("test_id")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)

  if (assignmentsError) {
    throw new Error(`Failed to fetch employee assignments: ${assignmentsError.message}`)
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from("test_attempts")
    .select("test_id")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)
    .eq("status", "completed")

  if (attemptsError) {
    throw new Error(`Failed to fetch employee attempts: ${attemptsError.message}`)
  }

  const testIds = [
    ...new Set([
      ...((assignments ?? []).map((row) => row.test_id) ?? []),
      ...((attempts ?? []).map((row) => row.test_id) ?? []),
    ]),
  ]

  for (const testId of testIds) {
    const linked = await isDocumentLinkedToTest(supabase, {
      testId,
      documentId: input.documentId,
      organizationId: input.organizationId,
    })

    if (linked) {
      return true
    }
  }

  return false
}
