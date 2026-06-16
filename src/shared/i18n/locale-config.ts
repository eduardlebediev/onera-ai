export const LOCALE_COOKIE_NAME = "NEXT_LOCALE" as const

export const SUPPORTED_LOCALES = ["en", "de"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "en"

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "de"
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

export function localeToIntlTag(locale: AppLocale): string {
  return locale === "de" ? "de-DE" : "en-US"
}
