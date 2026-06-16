import { EmployeeDashboardHeader } from "@/features/employee/tests/components/employee-dashboard-header"
import { EmployeeDashboardKpiSection } from "@/features/employee/tests/components/employee-dashboard-kpi-section"
import { EmployeeDashboardLearningFocus } from "@/features/employee/tests/components/employee-dashboard-learning-focus"
import { EmployeeDashboardNextTest } from "@/features/employee/tests/components/employee-dashboard-next-test"
import { EmployeeDashboardRecentFeedback } from "@/features/employee/tests/components/employee-dashboard-recent-feedback"
import { EmployeeDashboardReminders } from "@/features/employee/tests/components/employee-dashboard-reminders"
import { getEmployeeDashboardKpiStats } from "@/features/employee/tests/lib/employee-dashboard-kpi"
import {
  getEmployeeDashboardAttemptInsights,
  getNextRequiredTest,
} from "@/features/employee/tests/lib/employee-dashboard-model"
import { getEmployeeReminders } from "@/features/employee/tests/lib/supabase-employee-reminders"
import type { EmployeeAssignedTest } from "@/features/employee/tests/types/employee-test"
import type { AssignableEmployee } from "@/features/tests/types/assignment"
import { getTranslator } from "@/shared/i18n/get-locale"

interface EmployeeDashboardProps {
  employee: AssignableEmployee
  organizationId: string
  tests: EmployeeAssignedTest[]
  userId: string
}

export async function EmployeeDashboard({
  employee,
  organizationId,
  tests,
  userId,
}: EmployeeDashboardProps) {
  const { t, locale } = await getTranslator()

  const [{ recentFeedback, weakTopics }, reminders] = await Promise.all([
    getEmployeeDashboardAttemptInsights({
      userId,
      organizationId,
      tests,
      t,
    }),
    getEmployeeReminders({ userId, organizationId }).catch((error) => {
      console.error("Failed to load employee reminders from Supabase:", error)
      return []
    }),
  ])
  const nextTest = getNextRequiredTest(tests, t)
  const kpiStats = getEmployeeDashboardKpiStats(tests, weakTopics.length, t)

  return (
    <div className="page-shell">
      <EmployeeDashboardHeader employee={employee} t={t} />

      <div className="mt-8">
        <EmployeeDashboardKpiSection stats={kpiStats} />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <EmployeeDashboardNextTest nextTest={nextTest} locale={locale} t={t} />
        </div>

        <div className="lg:col-span-4">
          <EmployeeDashboardReminders reminders={reminders} locale={locale} t={t} />
        </div>

        <div className="lg:col-span-6">
          <EmployeeDashboardRecentFeedback recentFeedback={recentFeedback} t={t} />
        </div>

        <div className="lg:col-span-6">
          <EmployeeDashboardLearningFocus weakTopics={weakTopics} t={t} />
        </div>
      </div>
    </div>
  )
}
