import type { AppLocale } from "@/shared/i18n/locale-config"
import { formatDate } from "@/shared/i18n/format"
import {
  createTranslator,
  type createTranslator as CreateTranslatorType,
} from "@/shared/i18n/translate"

type Translate = ReturnType<typeof CreateTranslatorType>["t"]

export function formatEstimatedTime(locale: AppLocale, minutes: number): string {
  const { t } = createTranslator(locale)

  return minutes === 1
    ? t("employee.format.estimatedMinute")
    : t("employee.format.estimatedMinutes", { minutes })
}

export function formatEmployeeTestDeadline(
  locale: AppLocale,
  deadline: string | null,
  t: Translate
): string {
  if (!deadline) return t("common.noDeadline")

  return formatDate(locale, deadline)
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
