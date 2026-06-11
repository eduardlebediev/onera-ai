import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { AppShell } from "@/shared/components/app-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser()

  return (
    <AppShell role="admin" userName={user.profile.fullName ?? user.email} userTitle="Administrator">
      {children}
    </AppShell>
  )
}
