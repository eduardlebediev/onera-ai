import Link from "next/link"
import { Bell } from "lucide-react"

import type { EmployeeReminder } from "@/features/employee/tests/lib/supabase-employee-reminders"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeDashboardRemindersProps {
  reminders: EmployeeReminder[]
}

function formatReminderDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function getReminderMessage(reminder: EmployeeReminder): string {
  if (reminder.reason?.trim()) {
    return reminder.reason
  }

  return "Your admin sent you a reminder to complete assigned training."
}

export function EmployeeDashboardReminders({ reminders }: EmployeeDashboardRemindersProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <h2 className="typography-h3 font-semibold">Reminders</h2>
        </div>

        {reminders.length === 0 ? (
          <p className="typography-small text-muted-foreground">
            No reminders from your admin right now.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-3">
              {reminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {reminder.channel}
                    </Badge>
                    <span className="typography-small text-muted-foreground">
                      {formatReminderDate(reminder.createdAt)}
                    </span>
                  </div>
                  <p className="typography-small text-foreground">{getReminderMessage(reminder)}</p>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline">
              <Link href="/employee/tests">View assigned tests</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
