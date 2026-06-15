import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { KpiTone } from "@/shared/lib/kpi-tone-styles"
import { KPI_TONE_STYLES } from "@/shared/lib/kpi-tone-styles"
import { Card, CardContent } from "@/shared/ui/card"

export type KpiStatGridItem = {
  id: string
  label: string
  value: string
  icon: LucideIcon
  tone?: KpiTone
}

type KpiStatGridColumns = 1 | 2 | 4 | 5 | 6

const COLUMN_CLASSES: Record<KpiStatGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
}

interface KpiStatGridProps {
  stats: KpiStatGridItem[]
  columns?: KpiStatGridColumns
  className?: string
}

export function KpiStatGrid({ stats, columns = 4, className }: KpiStatGridProps) {
  return (
    <div className={cn("grid gap-2", COLUMN_CLASSES[columns], className)}>
      {stats.map((item) => {
        const Icon = item.icon
        const tone = item.tone ?? "neutral"
        const styles = KPI_TONE_STYLES[tone]

        return (
          <Card key={item.id} className="min-h-24">
            <CardContent className="flex h-full items-center gap-4 p-4">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full",
                  styles.iconContainer
                )}
              >
                <Icon className={cn("size-5", styles.icon)} />
              </div>
              <div className="flex flex-col">
                <p className="typography-small font-medium text-foreground">{item.label}</p>
                <span className="typography-h2 font-semibold">{item.value}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
