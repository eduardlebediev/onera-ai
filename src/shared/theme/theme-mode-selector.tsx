"use client"

import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu"

export type ThemeMode = "light" | "dark" | "system"

const THEME_MODES: ThemeMode[] = ["light", "dark", "system"]

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const

type ThemeModeSelectorProps = {
  variant?: "dropdown" | "login" | "minimal"
  className?: string
}

const subscribeNoop = () => () => {}

export function ThemeModeSelector({ variant = "dropdown", className }: ThemeModeSelectorProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )

  // next-themes reads persisted preference only after mount; defer active state to avoid hydration mismatch.
  const activeTheme = mounted ? (theme as ThemeMode | undefined) : undefined

  if (variant === "login" || variant === "minimal") {
    const isMinimal = variant === "minimal"

    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-semibold",
          isMinimal ? "" : "rounded-md border border-border bg-card p-0.5",
          className
        )}
        role="group"
        aria-label={t("theme.label")}
      >
        {THEME_MODES.map((mode) => {
          const Icon = THEME_ICONS[mode]
          const active = activeTheme === mode

          if (isMinimal) {
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={cn(
                  "cursor-pointer transition-colors px-1 py-0.5",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={t(`theme.${mode}`)}
                aria-pressed={active}
              >
                <Icon className="size-3.5" />
              </button>
            )
          }

          return (
            <Button
              key={mode}
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setTheme(mode)}
              className={cn(
                "size-7 rounded-md",
                active
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground"
              )}
              aria-label={t(`theme.${mode}`)}
              aria-pressed={active}
            >
              <Icon className="size-3.5" />
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
        {t("theme.label")}
      </DropdownMenuLabel>
      {THEME_MODES.map((mode) => {
        const Icon = THEME_ICONS[mode]
        const active = activeTheme === mode

        return (
          <DropdownMenuItem key={mode} onSelect={() => setTheme(mode)}>
            <Icon className="size-4" />
            <span className="flex-1">{t(`theme.${mode}`)}</span>
            {active ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        )
      })}
      <DropdownMenuSeparator />
    </>
  )
}
