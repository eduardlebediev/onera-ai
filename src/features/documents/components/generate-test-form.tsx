"use client"

import { ChevronDown, Search, Users, X } from "lucide-react"
import { useMemo, useState } from "react"

import {
  ALL_EMPLOYEES_TARGET,
  DIFFICULTY_OPTIONS,
  formatEmployeeTarget,
  type GenerateTestTargetEmployee,
  type GenerateTestSettings,
  type TestDifficulty,
} from "./generate-test-model"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import { useTranslation } from "@/shared/i18n/use-translation"
import { cn } from "@/lib/utils"

interface GenerateTestFormProps {
  settings: GenerateTestSettings
  targetEmployees: GenerateTestTargetEmployee[]
  onSettingsChange: (updates: Partial<GenerateTestSettings>) => void
}

type EmployeeOption = {
  employee: GenerateTestTargetEmployee
  value: string
  label: string
}

const formFieldClassName =
  "h-11 w-full rounded-xl border border-border bg-background text-sm font-medium text-foreground shadow-none outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-background"

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

function normalizeLegacyTargetRole(role: string): string {
  const legacyEmailSuffix = role.match(/^(.+?)\s*<[^>]+>$/)
  if (!legacyEmailSuffix) {
    return role
  }

  return legacyEmailSuffix[1].trim()
}

function parseSelectedTargets(targetRole: string, employeeOptions: EmployeeOption[]): string[] {
  const selectedRoles = targetRole
    .split(",")
    .map((role) => role.trim())
    .map(normalizeLegacyTargetRole)
    .flatMap((role) => {
      if (role === ALL_EMPLOYEES_TARGET) {
        return [ALL_EMPLOYEES_TARGET]
      }

      const matchingOption = employeeOptions.find(
        (option) => option.label === role || option.employee.name === role
      )

      return matchingOption ? [matchingOption.value] : []
    })

  return selectedRoles.length > 0 ? selectedRoles : [ALL_EMPLOYEES_TARGET]
}

export function GenerateTestForm({
  settings,
  targetEmployees,
  onSettingsChange,
}: GenerateTestFormProps) {
  const { t } = useTranslation()
  const [roleSearch, setRoleSearch] = useState("")
  const employeeOptions = useMemo(
    () =>
      targetEmployees.map((employee) => ({
        employee,
        value: employee.id,
        label: formatEmployeeTarget(employee, targetEmployees),
      })),
    [targetEmployees]
  )
  const selectedTargets = useMemo(() => {
    const validSelectedEmployeeIds = settings.targetEmployeeIds.filter((employeeId) =>
      employeeOptions.some((option) => option.value === employeeId)
    )

    if (validSelectedEmployeeIds.length > 0) {
      return validSelectedEmployeeIds
    }

    return parseSelectedTargets(settings.targetRole, employeeOptions)
  }, [employeeOptions, settings.targetEmployeeIds, settings.targetRole])
  const filteredEmployees = employeeOptions.filter(({ employee, label }) =>
    [employee.name, employee.email, employee.jobTitle, employee.department, label]
      .filter((part): part is string => Boolean(part))
      .some((part) => part.toLowerCase().includes(roleSearch.trim().toLowerCase()))
  )
  const selectedLabels = selectedTargets.map((target) => {
    if (target === ALL_EMPLOYEES_TARGET) {
      return t("common.targetRoles.allEmployees")
    }

    return employeeOptions.find((option) => option.value === target)?.label ?? target
  })

  function updateSelectedTargets(nextTargets: string[]) {
    if (nextTargets.includes(ALL_EMPLOYEES_TARGET)) {
      onSettingsChange({ targetRole: ALL_EMPLOYEES_TARGET, targetEmployeeIds: [] })
      return
    }

    const selectedOptions = nextTargets.flatMap((target) => {
      const option = employeeOptions.find((employeeOption) => employeeOption.value === target)
      return option ? [option] : []
    })

    onSettingsChange({
      targetRole: selectedOptions.map((option) => option.label).join(", "),
      targetEmployeeIds: selectedOptions.map((option) => option.value),
    })
  }

  function toggleTarget(target: string) {
    if (target === ALL_EMPLOYEES_TARGET) {
      updateSelectedTargets([target])
      return
    }

    const targetsWithoutAll = selectedTargets.filter(
      (selectedTarget) => selectedTarget !== ALL_EMPLOYEES_TARGET
    )
    const nextTargets = targetsWithoutAll.includes(target)
      ? targetsWithoutAll.filter((selectedTarget) => selectedTarget !== target)
      : [...targetsWithoutAll, target]

    updateSelectedTargets(nextTargets.length > 0 ? nextTargets : [ALL_EMPLOYEES_TARGET])
  }

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
              className={formFieldClassName}
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
                className={cn(formFieldClassName, "appearance-none pl-10 pr-4")}
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

          <div className="space-y-2 md:col-span-4">
            <span className="typography-small font-medium text-foreground">
              {t("documents.generateTest.configuration.targetRole")}
            </span>
            <DropdownMenu onOpenChange={(open) => !open && setRoleSearch("")}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xl"
                  className={cn(
                    formFieldClassName,
                    "justify-between gap-2 px-3 text-left hover:bg-background aria-expanded:bg-background"
                  )}
                  aria-label={t("documents.generateTest.configuration.targetRole")}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Users className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 items-center gap-1">
                      {selectedTargets.slice(0, 2).map((target, index) => (
                        <Badge
                          key={target}
                          variant="secondary"
                          className="max-w-32 truncate rounded-md font-normal"
                        >
                          {selectedLabels[index]}
                        </Badge>
                      ))}
                      {selectedLabels.length > 2 ? (
                        <Badge variant="outline" className="rounded-md font-normal">
                          +{selectedLabels.length - 2}
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width) p-2"
              >
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    onKeyDown={(event) => event.stopPropagation()}
                    placeholder={t("documents.generateTest.configuration.searchTargetRole")}
                    className="h-9 rounded-lg bg-background pl-9 pr-8"
                  />
                  {roleSearch ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="absolute right-1.5 top-1.5"
                      aria-label={t("common.clear")}
                      onClick={() => setRoleSearch("")}
                    >
                      <X className="size-3" />
                    </Button>
                  ) : null}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedTargets.includes(ALL_EMPLOYEES_TARGET)}
                  onCheckedChange={() => toggleTarget(ALL_EMPLOYEES_TARGET)}
                  onSelect={(event) => event.preventDefault()}
                  className="py-2"
                >
                  {t("common.targetRoles.allEmployees")}
                </DropdownMenuCheckboxItem>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(({ employee, value, label }) => (
                    <DropdownMenuCheckboxItem
                      key={employee.id}
                      checked={selectedTargets.includes(value)}
                      onCheckedChange={() => toggleTarget(value)}
                      onSelect={(event) => event.preventDefault()}
                      className="py-2"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{label}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {employee.email}
                        </span>
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    {t("documents.generateTest.configuration.noTargetRoles")}
                  </p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
              className={formFieldClassName}
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
              className={formFieldClassName}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
