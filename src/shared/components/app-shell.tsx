import type { AppRole } from "@/features/auth/lib/current-user"
import { TopNavbar } from "@/shared/ui/top-navbar"

type AppShellProps = {
  role: AppRole
  userName: string
  userTitle: string
  children: React.ReactNode
}

export function AppShell({ role, userName, userTitle, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-foreground font-sans">
      <TopNavbar role={role} userName={userName} userTitle={userTitle} />
      <main className="min-h-0 flex-1 overflow-hidden rounded-t-[24px] bg-background">
        <div className="flex h-full flex-col items-center overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
