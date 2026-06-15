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
import type { EmployeeAssignedTest } from "@/features/employee/tests/mock/employee-tests"
import type { MockEmployee } from "@/features/tests/mock/employees"

interface EmployeeDashboardProps {
  employee: MockEmployee
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
  const [{ recentFeedback, weakTopics }, reminders] = await Promise.all([
    getEmployeeDashboardAttemptInsights({
      userId,
      organizationId,
      tests,
    }),
    getEmployeeReminders({ userId, organizationId }).catch((error) => {
      console.error("Failed to load employee reminders from Supabase:", error)
      return []
    }),
  ])
  const nextTest = getNextRequiredTest(tests)
  const kpiStats = getEmployeeDashboardKpiStats(tests, weakTopics.length)

  return (
    <div className="page-shell">
      <EmployeeDashboardHeader employee={employee} />

      <div className="mt-8">
        <EmployeeDashboardKpiSection stats={kpiStats} />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <EmployeeDashboardNextTest nextTest={nextTest} />
        </div>

        <div className="lg:col-span-4">
          <EmployeeDashboardReminders reminders={reminders} />
        </div>

        <div className="lg:col-span-6">
          <EmployeeDashboardRecentFeedback recentFeedback={recentFeedback} />
        </div>

        <div className="lg:col-span-6">
          <EmployeeDashboardLearningFocus weakTopics={weakTopics} />
        </div>
      </div>
    </div>
  )
}
