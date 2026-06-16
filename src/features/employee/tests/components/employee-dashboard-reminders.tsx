import Link from "next/link"
import { Bell } from "lucide-react"

import type { EmployeeReminder } from "@/features/employee/tests/lib/supabase-employee-reminders"
import { formatDateTime } from "@/shared/i18n/format"
import type { AppLocale } from "@/shared/i18n/locale-config"
import type { createTranslator } from "@/shared/i18n/translate"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeDashboardRemindersProps {
  reminders: EmployeeReminder[]
  locale: AppLocale
  t: Translate
}

function getReminderMessage(reminder: EmployeeReminder, t: Translate): string {
  if (reminder.reason?.trim()) {
    return reminder.reason
  }

  return t("employee.dashboard.defaultReminder")
}

export function EmployeeDashboardReminders({
  reminders,
  locale,
  t,
}: EmployeeDashboardRemindersProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <h2 className="typography-h3 font-semibold">{t("employee.dashboard.reminders")}</h2>
        </div>

        {reminders.length === 0 ? (
          <p className="typography-small text-muted-foreground">
            {t("employee.dashboard.noReminders")}
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
                      {formatDateTime(locale, reminder.createdAt)}
                    </span>
                  </div>
                  <p className="typography-small text-foreground">
                    {getReminderMessage(reminder, t)}
                  </p>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline">
              <Link href="/employee/tests">{t("employee.dashboard.viewAssignedTests")}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
