export type KpiTone = "neutral" | "success" | "warning" | "danger"

export interface KpiToneStyle {
  iconContainer: string
  icon: string
}

export const KPI_TONE_STYLES: Record<KpiTone, KpiToneStyle> = {
  neutral: {
    iconContainer: "bg-muted/50",
    icon: "text-muted-foreground",
  },
  success: {
    iconContainer: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    iconContainer: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
  },
  danger: {
    iconContainer: "bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600 dark:text-red-400",
  },
}
