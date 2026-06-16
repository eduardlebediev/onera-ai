"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"

import type { AppLocale } from "@/shared/i18n/locale-config"
import { LanguageProvider } from "@/shared/i18n/language-context"
import { ThemeProvider } from "@/shared/theme/theme-provider"
import { Toaster } from "@/shared/ui/sonner"

type AppProvidersProps = {
  initialLocale: AppLocale
  children: ReactNode
}

export function AppProviders({ initialLocale, children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <NuqsAdapter>
          {children}
          <Toaster duration={4000} position="top-right" richColors />
        </NuqsAdapter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
