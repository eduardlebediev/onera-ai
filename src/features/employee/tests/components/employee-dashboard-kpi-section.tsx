import type { EmployeeDashboardKpiStat } from "@/features/employee/tests/lib/employee-dashboard-kpi"
import { KPI_TONE_STYLES } from "@/shared/lib/kpi-tone-styles"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeDashboardKpiSectionProps {
  stats: EmployeeDashboardKpiStat[]
}

export function EmployeeDashboardKpiSection({ stats }: EmployeeDashboardKpiSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((item) => {
        const Icon = item.icon
        const styles = KPI_TONE_STYLES[item.tone]

        return (
          <Card key={item.status} className="min-h-24">
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
