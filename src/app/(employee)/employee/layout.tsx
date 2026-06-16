import { requireEmployeeUser } from "@/features/auth/lib/require-auth"
import { AppShell } from "@/shared/components/app-shell"
import { getTranslator } from "@/shared/i18n/get-locale"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEmployeeUser()
  const { t } = await getTranslator()

  return (
    <AppShell
      role="employee"
      userName={user.profile.fullName ?? user.email}
      userTitle={t("roles.employee")}
    >
      {children}
    </AppShell>
  )
}
