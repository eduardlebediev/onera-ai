import { EmployeeDashboardHeader } from "@/features/employee/tests/components/employee-dashboard-header"
import { EmployeeDashboardKpiSection } from "@/features/employee/tests/components/employee-dashboard-kpi-section"
import { EmployeeDashboardLearningFocus } from "@/features/employee/tests/components/employee-dashboard-learning-focus"
import { EmployeeDashboardNextTest } from "@/features/employee/tests/components/employee-dashboard-next-test"
import { EmployeeDashboardQuickActions } from "@/features/employee/tests/components/employee-dashboard-quick-actions"
import { EmployeeDashboardRecentFeedback } from "@/features/employee/tests/components/employee-dashboard-recent-feedback"
import { getEmployeeDashboardKpiStats } from "@/features/employee/tests/lib/employee-dashboard-kpi"
import {
  getDashboardQuickActions,
  getEmployeeDashboardAttemptInsights,
  getNextRequiredTest,
} from "@/features/employee/tests/lib/employee-dashboard-model"
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
  const { recentFeedback, weakTopics } = await getEmployeeDashboardAttemptInsights({
    userId,
    organizationId,
    tests,
  })
  const nextTest = getNextRequiredTest(tests)
  const kpiStats = getEmployeeDashboardKpiStats(tests, weakTopics.length)
  const quickActions = getDashboardQuickActions(tests, nextTest, recentFeedback)

  return (
    <div className="page-shell">
      <EmployeeDashboardHeader employee={employee} />

      <div className="mt-8 flex flex-col gap-2">
        <EmployeeDashboardKpiSection stats={kpiStats} />

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <EmployeeDashboardNextTest nextTest={nextTest} />
          <EmployeeDashboardRecentFeedback recentFeedback={recentFeedback} />
        </div>

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <EmployeeDashboardLearningFocus weakTopics={weakTopics} />
          <EmployeeDashboardQuickActions actions={quickActions} />
        </div>
      </div>
    </div>
  )
}
