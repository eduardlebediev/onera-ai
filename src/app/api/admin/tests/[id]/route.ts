import { NextResponse } from "next/server"

import { AuthError, requireAdminApiUser } from "@/features/auth/lib/require-auth"
import { isMockTestId, isUuid } from "@/features/documents/lib/demo-document-ids"
import {
  deleteTest,
  TestLifecycleError,
  updateTestMetadata,
} from "@/features/tests/lib/test-lifecycle"
import {
  DeleteTestRequestSchema,
  TestMetadataUpdateRequestSchema,
} from "@/features/tests/schemas/test-lifecycle-schema"

interface TestLifecycleRouteContext {
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

async function getJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new Error("Invalid JSON body")
  }
}

export async function PATCH(request: Request, { params }: TestLifecycleRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      if (isMockTestId(id)) {
        return jsonError("Mock tests use the local demo flow", 404)
      }

      return jsonError("Invalid test id", 400)
    }

    let body: unknown
    try {
      body = await getJsonBody(request)
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    const parsed = TestMetadataUpdateRequestSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await updateTestMetadata({
      testId: id,
      organizationId: admin.membership.organizationId,
      metadata: parsed.data,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof TestLifecycleError) {
      return jsonError(error.message, lifecycleErrorStatus(error))
    }

    console.error("Update test metadata API error:", error)
    return jsonError("Internal server error", 500)
  }
}

export async function DELETE(request: Request, { params }: TestLifecycleRouteContext) {
  try {
    const admin = await requireAdminApiUser()
    const { id } = await params

    if (!isUuid(id)) {
      if (isMockTestId(id)) {
        return jsonError("Mock tests use the local demo flow", 404)
      }

      return jsonError("Invalid test id", 400)
    }

    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const parsed = DeleteTestRequestSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ")
      return jsonError(message || "Invalid request body", 400)
    }

    const result = await deleteTest({
      testId: id,
      organizationId: admin.membership.organizationId,
      deletedBy: admin.userId,
      deletionReason: parsed.data.deletionReason,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status)
    }

    if (error instanceof TestLifecycleError) {
      return jsonError(error.message, lifecycleErrorStatus(error))
    }

    console.error("Delete test API error:", error)
    return jsonError("Internal server error", 500)
  }
}
