import { DEFAULT_LOCALE, type AppLocale } from "@/shared/i18n/locale-config"
import { de } from "@/shared/i18n/de"
import { en } from "@/shared/i18n/en"

const MESSAGES = {
  en,
  de,
} as const

export type Messages = typeof en

export type TranslationKey = DotNestedKeys<Messages>

type DotNestedKeys<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: DotNestedKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
      }[keyof T & string]
    : never

function getNestedValue(source: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment]
    }

    return undefined
  }, source)
}

export function getMessages(locale: AppLocale): Messages {
  return MESSAGES[locale] as Messages
}

export function createTranslator(locale: AppLocale) {
  const messages = getMessages(locale)

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const value = getNestedValue(messages as Record<string, unknown>, key)

    if (typeof value !== "string") {
      const fallback = getNestedValue(en as Record<string, unknown>, key)
      if (typeof fallback === "string") {
        return interpolate(fallback, params)
      }
      return key
    }

    return interpolate(value, params)
  }

  return { t, locale }
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    return value === undefined ? `{${name}}` : String(value)
  })
}

export function createDefaultTranslator() {
  return createTranslator(DEFAULT_LOCALE)
}
