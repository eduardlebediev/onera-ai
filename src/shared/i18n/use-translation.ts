"use client"

import { useLanguage } from "@/shared/i18n/language-context"
import type { TranslationKey } from "@/shared/i18n/translate"

export function useTranslation() {
  const { locale, setLocale, t } = useLanguage()

  return { locale, setLocale, t }
}

export type { TranslationKey }
