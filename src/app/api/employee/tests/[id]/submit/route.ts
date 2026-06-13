import { NextResponse } from "next/server"

import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import { AuthError, requireEmployeeApiUser } from "@/features/auth/lib/require-auth"
import {
  SubmitAttemptError,
  submitEmployeeTestAttempt,
} from "@/features/employee/tests/lib/supabase-employee-attempts"
import { SubmitAttemptRequestSchema } from "@/features/employee/tests/schemas/submit-attempt-schema"

interface SubmitAttemptRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request, { params }: SubmitAttemptRouteContext) {
  try {
    const employee = await requireEmployeeApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      if (isMockTestId(id)) {
        return jsonError("Mock tests use the local demo submit flow", 404)
      }

      return jsonError("Invalid test id", 400)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = SubmitAttemptRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await submitEmployeeTestAttempt({
      testId: id,
      attemptId: parsedRequest.data.attemptId,
      answers: parsedRequest.data.answers,
      userId: employee.userId,
      organizationId: employee.membership.organizationId,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof SubmitAttemptError) {
      switch (error.code) {
        case "not_found":
          return jsonError(error.message, 404)
        case "forbidden":
          return jsonError(error.message, 403)
        case "already_completed":
          return jsonError(error.message, 409)
        case "invalid_questions":
          return jsonError(error.message, 422)
      }
    }

    console.error("Submit attempt API error:", error)
    return jsonError("Internal server error", 500)
  }
}
