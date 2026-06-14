import { EmployeeProgressPage } from "@/features/employee/tests/components/employee-progress-page"
import {
  getSupabaseEmployeeProgress,
  type EmployeeProgress,
} from "@/features/employee/tests/lib/supabase-employee-progress"
import { requireEmployeeUser } from "@/features/auth/lib/require-auth"

export const dynamic = "force-dynamic"

const EMPTY_PROGRESS: EmployeeProgress = {
  completedTestsCount: 0,
  averageScore: 0,
  strengths: [],
  weakTopics: [],
  attempts: [],
}

async function loadEmployeeProgress(
  userId: string,
  organizationId: string
): Promise<{ progress: EmployeeProgress; loadError: boolean }> {
  try {
    return {
      progress: await getSupabaseEmployeeProgress(userId, organizationId),
      loadError: false,
    }
  } catch (error) {
    console.error("Failed to load employee progress from Supabase:", error)
    return {
      progress: EMPTY_PROGRESS,
      loadError: true,
    }
  }
}

export default async function EmployeeProgressRoute() {
  const user = await requireEmployeeUser()
  const { progress, loadError } = await loadEmployeeProgress(
    user.userId,
    user.membership.organizationId
  )

  return <EmployeeProgressPage progress={progress} loadError={loadError} />
}
