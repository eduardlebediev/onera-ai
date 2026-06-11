import "server-only"

import { createClient } from "@/lib/supabase/server"

export type AppRole = "admin" | "employee"
export type MemberStatus = "invited" | "active" | "disabled"

export type ActiveMembership = {
  organizationId: string
  role: AppRole
  status: MemberStatus
}

export type CurrentUserProfile = {
  id: string
  email: string
  fullName: string | null
}

export type CurrentUser = {
  userId: string
  email: string
  profile: CurrentUserProfile
  membership: ActiveMembership
}

export type AuthenticatedSession = {
  userId: string
  email: string
  profile: CurrentUserProfile
  membership: ActiveMembership | null
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
}

type MembershipRow = {
  organization_id: string
  role: string
  status: string
}

function mapMembership(row: MembershipRow): ActiveMembership | null {
  if (row.status !== "active") {
    return null
  }

  if (row.role !== "admin" && row.role !== "employee") {
    return null
  }

  return {
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
  }
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const email = user.email ?? ""

  const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] =
    await Promise.all([
      supabase.from("profiles").select("id, email, full_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("organization_members")
        .select("organization_id, role, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
    ])

  if (profileError) {
    throw new Error(`Failed to load profile: ${profileError.message}`)
  }

  if (membershipError) {
    throw new Error(`Failed to load membership: ${membershipError.message}`)
  }

  const profileRow = profile as ProfileRow | null

  return {
    userId: user.id,
    email: profileRow?.email ?? email,
    profile: {
      id: user.id,
      email: profileRow?.email ?? email,
      fullName: profileRow?.full_name ?? null,
    },
    membership: membership ? mapMembership(membership as MembershipRow) : null,
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getAuthenticatedSession()

  if (!session?.membership) {
    return null
  }

  return {
    userId: session.userId,
    email: session.email,
    profile: session.profile,
    membership: session.membership,
  }
}
