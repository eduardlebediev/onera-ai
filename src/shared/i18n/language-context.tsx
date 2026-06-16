"use client"

import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type AppLocale } from "@/shared/i18n/locale-config"
import { createTranslator, type TranslationKey } from "@/shared/i18n/translate"

type LanguageContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function writeLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`
}

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale
  children: ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale ?? DEFAULT_LOCALE)

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (nextLocale === locale) {
        return
      }

      writeLocaleCookie(nextLocale)
      setLocaleState(nextLocale)
      router.refresh()
    },
    [locale, router]
  )

  const value = useMemo(() => {
    const { t } = createTranslator(locale)
    return { locale, setLocale, t }
  }, [locale, setLocale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }

  return context
}
