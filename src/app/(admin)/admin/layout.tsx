import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { AppShell } from "@/shared/components/app-shell"
import { getTranslator } from "@/shared/i18n/get-locale"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser()
  const { t } = await getTranslator()

  return (
    <AppShell
      role="admin"
      userName={user.profile.fullName ?? user.email}
      userTitle={t("roles.admin")}
    >
      {children}
    </AppShell>
  )
}
