import type { MockDocumentDetail } from "@/data/mock/documents"
import { getDocumentKpiStats } from "@/features/documents/lib/document-kpi-stats"
import { Card, CardContent } from "@/shared/ui/card"

interface DocumentsKpiSectionProps {
  documents: MockDocumentDetail[]
}

export function DocumentsKpiSection({ documents }: DocumentsKpiSectionProps) {
  const stats = getDocumentKpiStats(documents)

  const getPercentage = (value: string) => {
    const numericValue = Number(value)
    if (!documents.length || Number.isNaN(numericValue)) {
      return null
    }

    return ((numericValue / documents.length) * 100).toFixed(1)
  }

  const toneStyles = {
    neutral: {
      iconContainer: "bg-muted/50",
      icon: "text-muted-foreground",
      percentage: "text-muted-foreground",
    },
    success: {
      iconContainer: "bg-emerald-50 dark:bg-emerald-900/20",
      icon: "text-emerald-600 dark:text-emerald-400",
      percentage: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      iconContainer: "bg-orange-50 dark:bg-orange-900/20",
      icon: "text-orange-600 dark:text-orange-400",
      percentage: "text-orange-600 dark:text-orange-400",
    },
    danger: {
      iconContainer: "bg-red-50 dark:bg-red-900/20",
      icon: "text-red-600 dark:text-red-400",
      percentage: "text-red-600 dark:text-red-400",
    },
  } as const

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon
        const percentage = getPercentage(item.value)
        const styles = toneStyles[item.tone]

        return (
          <Card key={item.id} className="min-h-24">
            <CardContent className="flex h-full items-center gap-4 p-4">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${styles.iconContainer}`}
              >
                <Icon className={`size-5 ${styles.icon}`} />
              </div>
              <div className="flex flex-col">
                <p className="typography-small font-medium text-foreground">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="typography-h2 font-semibold">{item.value}</span>
                  {item.id === "total" ? (
                    <span className="typography-small text-muted-foreground">files</span>
                  ) : (
                    <span className={`typography-small font-medium ${styles.percentage}`}>
                      {percentage ?? "0.0"}%
                    </span>
                  )}
                </div>
                <p className="typography-small text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
