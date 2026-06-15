import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type EmployeeReminder = {
  id: string
  channel: "demo" | "email" | "slack"
  reason: string | null
  createdAt: string
}

type ReminderRow = {
  id: string
  channel: string
  reason: string | null
  created_at: string
}

function normalizeChannel(channel: string): EmployeeReminder["channel"] {
  if (channel === "email" || channel === "slack" || channel === "demo") {
    return channel
  }

  return "demo"
}

export async function getEmployeeReminders({
  userId,
  organizationId,
  limit = 3,
}: {
  userId: string
  organizationId: string
  limit?: number
}): Promise<EmployeeReminder[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("employee_nudge_events")
    .select("id, channel, reason, created_at")
    .eq("organization_id", organizationId)
    .eq("employee_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch employee reminders: ${error.message}`)
  }

  return ((data ?? []) as ReminderRow[]).map((reminder) => ({
    id: reminder.id,
    channel: normalizeChannel(reminder.channel),
    reason: reminder.reason,
    createdAt: reminder.created_at,
  }))
}
