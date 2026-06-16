import "server-only"

import type { GenerateTestTargetEmployee } from "@/features/documents/components/generate-test-model"
import { createAdminClient } from "@/lib/supabase/admin"

type MemberRow = {
  user_id: string | null
  department: string | null
  job_title: string | null
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
}

function employeeDisplayName(profile: ProfileRow | undefined): string {
  return profile?.full_name?.trim() || profile?.email?.trim() || "Employee"
}

export async function getGenerateTestTargetEmployees(
  organizationId: string
): Promise<GenerateTestTargetEmployee[]> {
  const supabase = createAdminClient()

  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id, department, job_title")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .eq("status", "active")
    .not("user_id", "is", null)

  if (membersError) {
    throw new Error(`Failed to fetch target employees: ${membersError.message}`)
  }

  const memberRows = (members ?? []) as MemberRow[]
  const userIds = memberRows
    .map((member) => member.user_id)
    .filter((userId): userId is string => Boolean(userId))

  if (userIds.length === 0) {
    return []
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  if (profilesError) {
    throw new Error(`Failed to fetch target employee profiles: ${profilesError.message}`)
  }

  const profilesById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  )

  return memberRows
    .flatMap((member) => {
      if (!member.user_id) {
        return []
      }

      const profile = profilesById.get(member.user_id)

      return [
        {
          id: member.user_id,
          name: employeeDisplayName(profile),
          email: profile?.email ?? "No email",
          jobTitle: member.job_title,
          department: member.department,
        },
      ]
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
