import { NextResponse } from "next/server"
import { z } from "zod"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { EmployeeActionError, logEmployeeNudges } from "@/features/employees/lib/supabase-employees"

const NudgeEmployeesRequestSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1, "Select at least one employee"),
  reason: z.string().trim().min(1).max(200).optional(),
  channel: z.enum(["demo", "email", "slack"]).optional(),
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

    const parsedRequest = NudgeEmployeesRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await logEmployeeNudges({
      organizationId: admin.membership.organizationId,
      nudgedBy: admin.userId,
      employeeUserIds: parsedRequest.data.employeeIds,
      reason: parsedRequest.data.reason ?? "Admin reminder from employee management",
      channel: parsedRequest.data.channel ?? "email",
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError || error instanceof EmployeeActionError) {
      return jsonError(error.message, error.status)
    }

    console.error("Nudge employee API error:", error)
    return jsonError("Internal server error", 500)
  }
}
