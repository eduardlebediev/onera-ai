import "server-only"

import { redirect } from "next/navigation"

import {
  getAuthenticatedSession,
  getCurrentUser,
  type CurrentUser,
} from "@/features/auth/lib/current-user"
import { createAdminClient } from "@/lib/supabase/admin"

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "AuthError"
  }
}

export async function requireAuthenticatedSession() {
  const session = await getAuthenticatedSession()

  if (!session) {
    redirect("/login")
  }

  if (!session.membership) {
    redirect("/access-denied")
  }

  return session as AuthenticatedSessionWithMembership
}

export type AuthenticatedSessionWithMembership = {
  userId: string
  email: string
  profile: CurrentUser["profile"]
  membership: CurrentUser["membership"]
}

export async function requireAdminUser(): Promise<CurrentUser> {
  const session = await requireAuthenticatedSession()

  if (session.membership.role !== "admin") {
    redirect("/employee/dashboard")
  }

  return session
}

export async function requireEmployeeUser(): Promise<CurrentUser> {
  const session = await requireAuthenticatedSession()

  if (session.membership.role !== "employee") {
    redirect("/admin/dashboard")
  }

  return session
}

export async function requireAdminApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthError(401, "Unauthorized")
  }

  if (user.membership.role !== "admin") {
    throw new AuthError(403, "Forbidden")
  }

  return user
}

export async function requireEmployeeApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthError(401, "Unauthorized")
  }

  if (user.membership.role !== "employee") {
    throw new AuthError(403, "Forbidden")
  }

  return user
}

export async function verifyDocumentInOrganization(
  documentId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to verify document organization: ${error.message}`)
  }

  return Boolean(data)
}

export async function verifyTestInOrganization(
  testId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("tests")
    .select("id")
    .eq("id", testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to verify test organization: ${error.message}`)
  }

  return Boolean(data)
}
