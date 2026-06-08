import { getTestResultKpiStats } from "@/features/employee/tests/lib/test-result-kpi-stats"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import { KPI_TONE_STYLES } from "@/shared/lib/kpi-tone-styles"
import { Card, CardContent } from "@/shared/ui/card"

interface TestResultKpiSectionProps {
  result: EmployeeTestResult
}

export function TestResultKpiSection({ result }: TestResultKpiSectionProps) {
  const stats = getTestResultKpiStats(result)

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {stats.map((item) => {
        const Icon = item.icon
        const styles = KPI_TONE_STYLES[item.tone]

        return (
          <Card key={item.id} className="min-h-20">
            <CardContent className="flex h-full items-center gap-3 p-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${styles.iconContainer}`}
              >
                <Icon className={`size-4.5 ${styles.icon}`} />
              </div>
              <div className="flex flex-col">
                <p className="typography-small font-medium text-foreground">{item.label}</p>
                <span className="typography-h3 font-semibold">{item.value}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
