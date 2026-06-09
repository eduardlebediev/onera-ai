import type { MockEmployee } from "@/features/tests/mock/employees"
import { Badge } from "@/shared/ui/badge"

interface EmployeeDashboardHeaderProps {
  employee: MockEmployee
}

export function EmployeeDashboardHeader({ employee }: EmployeeDashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="typography-label text-muted-foreground">Welcome back</p>
        <h1 className="typography-h1">{employee.name}</h1>
        <p className="mt-1 typography-p text-muted-foreground">
          Continue your assigned knowledge checks and review feedback.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{employee.role}</Badge>
        <Badge variant="outline">{employee.department}</Badge>
      </div>
    </div>
  )
}
