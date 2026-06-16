import { NextResponse } from "next/server"

import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import { AuthError, requireEmployeeApiUser } from "@/features/auth/lib/require-auth"
import {
  StartAttemptError,
  startEmployeeTestAttempt,
} from "@/features/employee/tests/lib/supabase-employee-attempts"

interface StartAttemptRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(_request: Request, { params }: StartAttemptRouteContext) {
  try {
    const employee = await requireEmployeeApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      if (isMockTestId(id)) {
        return jsonError("Invalid test id", 400)
      }

      return jsonError("Invalid test id", 400)
    }

    const result = await startEmployeeTestAttempt(
      id,
      employee.userId,
      employee.membership.organizationId
    )

    if (!result) {
      return jsonError("Test not found or not assigned", 404)
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof StartAttemptError) {
      if (
        error.code === "assignment_finished" ||
        error.code === "test_inactive" ||
        error.code === "max_attempts_reached"
      ) {
        return jsonError(error.message, 409)
      }
    }

    console.error("Start attempt API error:", error)
    return jsonError("Internal server error", 500)
  }
}
