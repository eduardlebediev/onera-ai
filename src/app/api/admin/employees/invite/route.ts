import { NextResponse } from "next/server"
import { z } from "zod"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { EmployeeActionError, inviteEmployee } from "@/features/employees/lib/supabase-employees"

const InviteEmployeeRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  department: z.string().trim().min(1, "Department is required"),
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

    const parsedRequest = InviteEmployeeRequestSchema.safeParse(body)

    if (!parsedRequest.success) {
      const message = parsedRequest.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const employee = await inviteEmployee({
      organizationId: admin.membership.organizationId,
      invitedBy: admin.userId,
      fullName: parsedRequest.data.fullName,
      email: parsedRequest.data.email,
      department: parsedRequest.data.department,
    })

    return NextResponse.json({ employee })
  } catch (error) {
    if (error instanceof AuthError || error instanceof EmployeeActionError) {
      return jsonError(error.message, error.status)
    }

    console.error("Invite employee API error:", error)
    return jsonError("Internal server error", 500)
  }
}
