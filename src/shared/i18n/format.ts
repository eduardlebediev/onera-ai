import { localeToIntlTag, type AppLocale } from "@/shared/i18n/locale-config"

export function formatDate(
  locale: AppLocale,
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  return new Date(dateStr).toLocaleDateString(localeToIntlTag(locale), options)
}

export function formatDateTime(locale: AppLocale, dateStr: string): string {
  return new Date(dateStr).toLocaleString(localeToIntlTag(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatTime(locale: AppLocale, dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(localeToIntlTag(locale), {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatRelativeUploadDate(
  locale: AppLocale,
  dateStr: string,
  labels: { today: string; yesterday: string }
): string {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (dayDiff === 0) {
    return `${labels.today}, ${formatTime(locale, dateStr)}`
  }

  if (dayDiff === 1) {
    return `${labels.yesterday}, ${formatTime(locale, dateStr)}`
  }

  return formatDateTime(locale, dateStr)
}

export function formatNumber(locale: AppLocale, value: number): string {
  return new Intl.NumberFormat(localeToIntlTag(locale)).format(value)
}

export function formatPercent(locale: AppLocale, value: number): string {
  return new Intl.NumberFormat(localeToIntlTag(locale), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100)
}
