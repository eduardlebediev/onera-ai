import "server-only"

import { cookies } from "next/headers"

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  resolveLocale,
  type AppLocale,
} from "@/shared/i18n/locale-config"
import { createTranslator } from "@/shared/i18n/translate"

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies()
  return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE)
}

export async function getTranslator() {
  const locale = await getLocale()
  return createTranslator(locale)
}
