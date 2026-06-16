"use client"

import type { AssignmentSettings } from "@/features/tests/lib/assign-employees-model"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { cn } from "@/lib/utils"

interface AssignSettingsPanelProps {
  settings: AssignmentSettings
  selectedCount: number
  onSettingsChange: (settings: AssignmentSettings) => void
}

export function AssignSettingsPanel({
  settings,
  selectedCount,
  onSettingsChange,
}: AssignSettingsPanelProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tests.assign.settings.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="assignment-deadline" className="typography-small text-muted-foreground">
            {t("tests.assign.settings.deadline")}
          </label>
          <Input
            id="assignment-deadline"
            type="date"
            className="mt-1.5"
            value={settings.deadline}
            onChange={(event) => onSettingsChange({ ...settings, deadline: event.target.value })}
          />
        </div>

        <div>
          <label htmlFor="assignment-note" className="typography-small text-muted-foreground">
            {t("tests.assign.settings.note")}
          </label>
          <textarea
            id="assignment-note"
            rows={3}
            value={settings.note}
            onChange={(event) => onSettingsChange({ ...settings, note: event.target.value })}
            placeholder={t("tests.assign.settings.notePlaceholder")}
            className={cn(
              "mt-1.5 w-full rounded-lg border border-input bg-input px-2.5 py-2 text-sm transition-colors outline-none",
              "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("tests.assign.settings.sendReminder")}
            </p>
            <p className="typography-small text-muted-foreground">
              {t("tests.assign.settings.reminderUnavailable")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reminderEnabled}
            aria-label={t("tests.assign.settings.toggleReminder")}
            onClick={() =>
              onSettingsChange({ ...settings, reminderEnabled: !settings.reminderEnabled })
            }
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              settings.reminderEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
                settings.reminderEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3">
          <p className="typography-small text-muted-foreground">
            {t("tests.assign.settings.selectedEmployees")}
          </p>
          <p className="text-lg font-semibold text-foreground">{selectedCount}</p>
        </div>
      </CardContent>
    </Card>
  )
}
