import Link from "next/link"
import { redirect } from "next/navigation"

import { getAuthenticatedSession } from "@/features/auth/lib/current-user"
import { AuthLanguageSwitcher } from "@/features/auth/components/auth-language-switcher"
import { getTranslator } from "@/shared/i18n/get-locale"
import { Button } from "@/shared/ui/button"

export default async function AccessDeniedPage() {
  const session = await getAuthenticatedSession()

  if (!session) {
    redirect("/login")
  }

  if (session.membership) {
    redirect(session.membership.role === "admin" ? "/admin/dashboard" : "/employee/dashboard")
  }

  const { t } = await getTranslator()

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center">
      <div className="flex justify-center">
        <AuthLanguageSwitcher />
      </div>
      <h1 className="typography-h2 text-foreground">{t("auth.accessDenied")}</h1>
      <p className="typography-p text-muted-foreground">{t("auth.accessDeniedMessage")}</p>
      <form action="/auth/logout" method="post">
        <Button type="submit" variant="outline" className="w-full">
          {t("nav.signOut")}
        </Button>
      </form>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">{t("auth.backToSignIn")}</Link>
      </Button>
    </div>
  )
}
