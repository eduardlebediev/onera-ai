"use client"

import { cn } from "@/lib/utils"
import type { AppLocale } from "@/shared/i18n/locale-config"
import { useTranslation } from "@/shared/i18n/use-translation"

type LanguageSwitcherProps = {
  className?: string
  variant?: "navbar" | "default" | "minimal"
}

const LOCALES: AppLocale[] = ["en", "de"]

export function LanguageSwitcher({ className, variant = "default" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation()

  const isNavbar = variant === "navbar"
  const isMinimal = variant === "minimal"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        isNavbar
          ? "rounded-md p-0.5 border border-background/15 bg-background/5"
          : isMinimal
            ? ""
            : "rounded-md p-0.5 border border-border bg-card",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((item) => {
        const active = locale === item

        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={cn(
              "cursor-pointer uppercase transition-colors",
              isMinimal
                ? active
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
                : "rounded px-2 py-1",
              isNavbar && !isMinimal
                ? active
                  ? "bg-background text-foreground"
                  : "text-background/60 hover:text-background"
                : !isMinimal && active
                  ? "bg-primary text-primary-foreground"
                  : !isMinimal && "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
