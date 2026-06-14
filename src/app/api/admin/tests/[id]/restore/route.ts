import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import { restoreTest, TestLifecycleError } from "@/features/tests/lib/test-lifecycle"

interface RestoreTestRouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function lifecycleErrorStatus(error: TestLifecycleError): number {
  switch (error.code) {
    case "not_found":
      return 404
    case "invalid_status":
    case "attempts_exist":
    case "migration_required":
      return 409
  }
}

export async function POST(_request: Request, { params }: RestoreTestRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      if (isMockTestId(id)) {
        return jsonError("Mock tests use the local demo flow", 404)
      }

      return jsonError("Invalid test id", 400)
    }

    const result = await restoreTest({
      testId: id,
      organizationId: admin.membership.organizationId,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof TestLifecycleError) {
      return jsonError(error.message, lifecycleErrorStatus(error))
    }

    console.error("Restore test API error:", error)
    return jsonError("Internal server error", 500)
  }
}
