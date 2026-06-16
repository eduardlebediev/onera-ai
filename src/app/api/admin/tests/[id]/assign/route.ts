import { NextResponse } from "next/server"
import { z } from "zod"

import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import {
  AuthError,
  requireAdminApiUser,
  verifyTestInOrganization,
} from "@/features/auth/lib/require-auth"
import { createSupabaseTestAssignments } from "@/features/tests/lib/supabase-assignments"
import { isTestAssignable } from "@/features/tests/lib/test-source-validity-style"

const AssignTestRequestSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, "Select at least one employee"),
  deadline: z.string().datetime().nullable().optional(),
})

interface AssignTestRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request, { params }: AssignTestRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      if (isMockTestId(id)) {
        return jsonError("Invalid test id", 400)
      }

      return jsonError("Invalid test id", 400)
    }

    const testInOrg = await verifyTestInOrganization(id, admin.membership.organizationId)

    if (!testInOrg) {
      return jsonError("Test not found", 404)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = AssignTestRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await createSupabaseTestAssignments({
      testId: id,
      userIds: parsedRequest.data.userIds,
      deadline: parsedRequest.data.deadline ?? null,
    })

    if (!result) {
      return jsonError("Test not found", 404)
    }

    if (result.test.organizationId !== admin.membership.organizationId) {
      return jsonError("Forbidden", 403)
    }

    if (result.test.status !== "published") {
      return jsonError("Only published tests can be assigned", 409)
    }

    if (
      !isTestAssignable({
        status: result.test.status,
        isActive: result.test.isActive,
        sourceValidity: result.test.sourceValidity,
      })
    ) {
      return jsonError("This test is inactive because its source document is invalid", 409)
    }

    if (result.invalidUserIds.length > 0) {
      return jsonError("Selected users must be active employees in this organization", 422)
    }

    return NextResponse.json({
      testId: result.test.id,
      created: result.created,
      skipped: result.skipped,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Assign test API error:", error)
    return jsonError("Internal server error", 500)
  }
}
