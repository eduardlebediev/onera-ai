"use client"

import {
  DIFFICULTY_OPTIONS,
  TARGET_ROLE_OPTIONS,
  type GenerateTestSettings,
  type TestDifficulty,
} from "./generate-test-model"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { useTranslation } from "@/shared/i18n/use-translation"

interface GenerateTestFormProps {
  settings: GenerateTestSettings
  onSettingsChange: (updates: Partial<GenerateTestSettings>) => void
}

function parseNumericInput(value: string, fallback: number, min: number, max: number): number {
  if (value.trim() === "") {
    return fallback
  }

  const parsedValue = Number(value)

  if (Number.isFinite(parsedValue)) {
    return Math.min(Math.max(parsedValue, min), max)
  }

  return fallback
}

const TARGET_ROLE_LABEL_KEYS = {
  "All employees": "common.targetRoles.allEmployees",
  "New employees": "common.targetRoles.newEmployees",
  "Engineering team": "common.targetRoles.engineeringTeam",
  "Customer support": "common.targetRoles.customerSupport",
  "Operations staff": "common.targetRoles.operationsStaff",
  "HR team": "common.targetRoles.hrTeam",
} as const

export function GenerateTestForm({ settings, onSettingsChange }: GenerateTestFormProps) {
  const { t } = useTranslation()

  return (
    <Card className="shadow-sm">
      <CardHeader className="px-6 py-5 border-b border-border/50">
        <CardTitle className="text-base font-semibold">
          {t("documents.generateTest.configuration.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-12">
          <label className="space-y-2 md:col-span-5">
            <span className="typography-small font-medium text-foreground">
              {t("documents.generateTest.configuration.testTitle")}
            </span>
            <Input
              value={settings.title}
              onChange={(event) => onSettingsChange({ title: event.target.value })}
              placeholder={t("documents.generateTest.configuration.testTitlePlaceholder")}
              className="h-11 rounded-xl bg-background border-border"
            />
          </label>

          <label className="space-y-2 md:col-span-3">
            <span className="typography-small font-medium text-foreground">
              {t("documents.generateTest.configuration.difficulty")}
            </span>
            <div className="relative">
              <select
                value={settings.difficulty}
                onChange={(event) =>
                  onSettingsChange({ difficulty: event.target.value as TestDifficulty })
                }
                className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`common.difficulty.${option.value}`)}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-3.5 size-4 rounded-full flex items-center justify-center">
                <div
                  className={`size-2.5 rounded-full ${settings.difficulty === "easy" ? "bg-emerald-500" : settings.difficulty === "medium" ? "bg-orange-500" : "bg-red-500"}`}
                ></div>
              </div>
            </div>
          </label>

          <label className="space-y-2 md:col-span-4">
            <span className="typography-small font-medium text-foreground">
              {t("documents.generateTest.configuration.targetRole")}
            </span>
            <div className="relative">
              <select
                value={settings.targetRole}
                onChange={(event) => onSettingsChange({ targetRole: event.target.value })}
                className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {TARGET_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {t(
                      TARGET_ROLE_LABEL_KEYS[role as keyof typeof TARGET_ROLE_LABEL_KEYS] ??
                        "common.general"
                    )}
                  </option>
                ))}
              </select>
              <svg
                className="absolute left-3.5 top-3 size-4 text-muted-foreground pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </label>

          <label className="space-y-2 md:col-span-3">
            <span className="typography-small font-medium text-foreground">
              {t("documents.generateTest.configuration.questionCount")}
            </span>
            <Input
              type="number"
              min={3}
              max={10}
              value={settings.questionCount}
              onChange={(event) =>
                onSettingsChange({
                  questionCount: parseNumericInput(
                    event.target.value,
                    settings.questionCount,
                    3,
                    10
                  ),
                })
              }
              className="h-11 rounded-xl bg-background border-border"
            />
          </label>

          <label className="space-y-2 md:col-span-3">
            <span className="typography-small font-medium text-foreground">
              {t("documents.generateTest.configuration.passingScore")}
            </span>
            <Input
              type="number"
              min={1}
              max={100}
              value={settings.passingScore}
              onChange={(event) =>
                onSettingsChange({
                  passingScore: parseNumericInput(
                    event.target.value,
                    settings.passingScore,
                    1,
                    100
                  ),
                })
              }
              className="h-11 rounded-xl bg-background border-border"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
