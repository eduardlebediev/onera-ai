import { NextResponse } from "next/server"

import { isUuid } from "@/features/documents/lib/demo-document-ids"
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
  // TODO: Replace hardcoded demo employee with authenticated user after auth spec.
  try {
    const { id } = await params

    if (!isUuid(id)) {
      return jsonError("Invalid test id", 400)
    }

    const result = await startEmployeeTestAttempt(id)

    if (!result) {
      return jsonError("Test not found or not assigned", 404)
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof StartAttemptError) {
      if (error.code === "assignment_finished") {
        return jsonError(error.message, 409)
      }
    }

    console.error("Start attempt API error:", error)
    return jsonError("Internal server error", 500)
  }
}
