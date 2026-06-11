import { redirect } from "next/navigation"

import { getAuthenticatedSession } from "@/features/auth/lib/current-user"

export default async function Home() {
  const session = await getAuthenticatedSession()

  if (!session) {
    redirect("/login")
  }

  if (!session.membership) {
    redirect("/access-denied")
  }

  if (session.membership.role === "admin") {
    redirect("/admin/dashboard")
  }

  redirect("/employee/dashboard")
}
