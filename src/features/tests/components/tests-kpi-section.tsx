import type { MockTest } from "@/features/tests/mock/tests"
import { getTestKpiStats } from "@/features/tests/lib/test-kpi-stats"
import { Card, CardContent } from "@/shared/ui/card"

interface TestsKpiSectionProps {
  tests: MockTest[]
}

export function TestsKpiSection({ tests }: TestsKpiSectionProps) {
  const stats = getTestKpiStats(tests)

  const toneStyles = {
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
  } as const

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((item) => {
        const Icon = item.icon
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
                <span className="typography-h2 font-semibold">{item.value}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
