import { notFound } from "next/navigation"

import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { isUuid } from "@/features/documents/lib/demo-document-ids"
import { EmployeeDetailPage } from "@/features/employees/components/employee-detail-page"
import { getSupabaseEmployeeDetail } from "@/features/employees/lib/supabase-employee-detail"

interface EmployeeDetailPlaceholderProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function EmployeeDetailRoute({ params }: EmployeeDetailPlaceholderProps) {
  const { id } = await params

  if (!isUuid(id)) {
    notFound()
  }

  const user = await requireAdminUser()
  const organizationId = user.membership.organizationId

  let employee = null

  try {
    employee = await getSupabaseEmployeeDetail(id, organizationId)
  } catch (error) {
    console.error(`Failed to load employee detail ${id} from Supabase:`, error)
    notFound()
  }

  if (!employee) {
    notFound()
  }

  return <EmployeeDetailPage employee={employee} />
}
