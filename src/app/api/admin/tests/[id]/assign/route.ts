import { NextResponse } from "next/server"
import { z } from "zod"

import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { createSupabaseTestAssignments } from "@/features/tests/lib/supabase-assignments"

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
  // TODO: Enforce real admin authorization before production.
  try {
    const { id } = await params

    if (!isUuid(id)) {
      return jsonError("Invalid test id", 400)
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

    if (result.test.status !== "published") {
      return jsonError("Only published tests can be assigned", 409)
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
    console.error("Assign test API error:", error)
    return jsonError("Internal server error", 500)
  }
}
