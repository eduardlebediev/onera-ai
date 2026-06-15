import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { getSupabaseEmployeeDetail } from "@/features/employees/lib/supabase-employee-detail"

interface EmployeeDetailRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(_request: Request, { params }: EmployeeDetailRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      return jsonError("Invalid employee id", 400)
    }

    const employee = await getSupabaseEmployeeDetail(id, admin.membership.organizationId)

    if (!employee) {
      return jsonError("Employee not found", 404)
    }

    return NextResponse.json({ employee })
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    console.error("Employee detail API error:", error)
    return jsonError("Internal server error", 500)
  }
}
