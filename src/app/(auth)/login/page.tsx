import { redirect } from "next/navigation"

import { LoginForm } from "@/features/auth/components/login-form"
import { getAuthenticatedSession } from "@/features/auth/lib/current-user"

export default async function LoginPage() {
  const session = await getAuthenticatedSession()

  if (session?.membership) {
    redirect(session.membership.role === "admin" ? "/admin/dashboard" : "/employee/dashboard")
  }

  return <LoginForm />
}
