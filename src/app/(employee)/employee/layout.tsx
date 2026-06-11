import { requireEmployeeUser } from "@/features/auth/lib/require-auth"
import { AppShell } from "@/shared/components/app-shell"

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEmployeeUser()

  return (
    <AppShell
      role="employee"
      userName={user.profile.fullName ?? user.email}
      userTitle="Team Member"
    >
      {children}
    </AppShell>
  )
}
