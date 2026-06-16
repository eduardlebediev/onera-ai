import type { AppLocale } from "@/shared/i18n/locale-config"
import { formatDate as formatLocaleDate } from "@/shared/i18n/format"

export function formatTestDate(locale: AppLocale, dateStr: string): string {
  return formatLocaleDate(locale, dateStr)
}
