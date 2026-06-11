import Link from "next/link"
import { redirect } from "next/navigation"

import { getAuthenticatedSession } from "@/features/auth/lib/current-user"
import { Button } from "@/shared/ui/button"

export default async function AccessDeniedPage() {
  const session = await getAuthenticatedSession()

  if (!session) {
    redirect("/login")
  }

  if (session.membership) {
    redirect(session.membership.role === "admin" ? "/admin/dashboard" : "/employee/dashboard")
  }

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="typography-h2 text-foreground">Access denied</h1>
      <p className="typography-p text-muted-foreground">
        Your account is signed in but does not have an active organization membership. Contact your
        administrator for access.
      </p>
      <form action="/auth/logout" method="post">
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  )
}
