import { NextResponse } from "next/server"

import { AuthError, requireEmployeeApiUser } from "@/features/auth/lib/require-auth"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { getPersistedEmployeeTestResult } from "@/features/employee/tests/lib/supabase-employee-attempts"

interface EmployeeTestResultRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request, { params }: EmployeeTestResultRouteContext) {
  try {
    const employee = await requireEmployeeApiUser()
    const { id } = await params
    const attemptId = new URL(request.url).searchParams.get("attemptId")

    if (!isUuid(id)) {
      return jsonError("Invalid test id", 400)
    }

    if (!attemptId || !isUuid(attemptId)) {
      return jsonError("Invalid attempt id", 400)
    }

    const result = await getPersistedEmployeeTestResult(
      id,
      attemptId,
      employee.userId,
      employee.membership.organizationId
    )

    if (!result) {
      return jsonError("Test result not found", 404)
    }

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Employee test result API error:", error)
    return jsonError("Internal server error", 500)
  }
}
