import type { AssignableEmployee } from "@/features/tests/types/assignment"

interface EmployeeDashboardHeaderProps {
  employee: AssignableEmployee
}

export function EmployeeDashboardHeader({ employee }: EmployeeDashboardHeaderProps) {
  return (
    <div>
      <p className="typography-label text-muted-foreground">Welcome back</p>
      <h1 className="typography-h1">{employee.name}</h1>
      <p className="mt-1 typography-p text-muted-foreground">
        Continue your assigned knowledge checks and review feedback.
      </p>
    </div>
  )
}
