import type { AssignableEmployee } from "@/features/tests/types/assignment"
import type { createTranslator } from "@/shared/i18n/translate"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeDashboardHeaderProps {
  employee: AssignableEmployee
  t: Translate
}

export function EmployeeDashboardHeader({ employee, t }: EmployeeDashboardHeaderProps) {
  return (
    <div>
      <p className="typography-label text-muted-foreground">{t("common.welcomeBack")}</p>
      <h1 className="typography-h1">{employee.name}</h1>
      <p className="mt-1 typography-p text-muted-foreground">{t("employee.dashboard.subtitle")}</p>
    </div>
  )
}
