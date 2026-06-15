import { NextResponse } from "next/server"
import { z } from "zod"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import {
  bulkAssignTestToDepartment,
  EmployeeActionError,
} from "@/features/employees/lib/supabase-employees"

const BulkAssignRequestSchema = z.object({
  testId: z.string().uuid("Invalid test id"),
  department: z.string().trim().min(1).nullable(),
})

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiUser()
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsedRequest = BulkAssignRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await bulkAssignTestToDepartment({
      organizationId: admin.membership.organizationId,
      assignedBy: admin.userId,
      testId: parsedRequest.data.testId,
      department: parsedRequest.data.department,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError || error instanceof EmployeeActionError) {
      return jsonError(error.message, error.status)
    }

    console.error("Bulk assign API error:", error)
    return jsonError("Internal server error", 500)
  }
}
