"use client"

import { useActionState } from "react"

import { demoLoginAction, loginAction, type LoginState } from "@/features/auth/actions/login"
import { AuthLanguageSwitcher } from "@/features/auth/components/auth-language-switcher"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Logo } from "@/shared/ui/logo"

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"

export function LoginForm() {
  const { t } = useTranslation()
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, null)
  const [demoState, demoFormAction, isDemoPending] = useActionState<LoginState, FormData>(
    demoLoginAction,
    null
  )

  const demoAccounts = [
    {
      role: "admin",
      label: t("auth.demoAdmin"),
      description: t("auth.demoAdminDescription"),
    },
    {
      role: "employee",
      label: t("auth.demoEmployee"),
      description: t("auth.demoEmployeeDescription"),
    },
  ]

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center [&_span]:text-foreground">
        <Logo />
        <AuthLanguageSwitcher />
        <div className="space-y-1">
          <h1 className="typography-h2 text-foreground">{t("auth.signInTitle")}</h1>
          <p className="typography-small text-muted-foreground">{t("auth.signInSubtitle")}</p>
        </div>
      </div>

      {DEMO_LOGIN_ENABLED ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2 text-center">
            <p className="typography-small font-medium text-foreground">{t("auth.demoIntro")}</p>
            <p className="typography-small text-muted-foreground">{t("auth.demoHint")}</p>
          </div>
          <div className="grid gap-2">
            {demoAccounts.map((account) => (
              <form key={account.role} action={demoFormAction}>
                <input type="hidden" name="role" value={account.role} />
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto w-full"
                  disabled={isDemoPending}
                >
                  <span className="flex flex-col items-start gap-0.5 py-1 text-left">
                    <span>{account.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {account.description}
                    </span>
                  </span>
                </Button>
              </form>
            ))}
          </div>
          {demoState?.error ? (
            <p className="typography-small text-destructive" role="alert">
              {demoState.error}
            </p>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="email" className="typography-small font-medium text-foreground">
            {t("auth.email")}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending || isDemoPending}
            placeholder={t("auth.emailPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="typography-small font-medium text-foreground">
            {t("auth.password")}
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending || isDemoPending}
            placeholder={t("auth.passwordPlaceholder")}
          />
        </div>

        {state?.error ? (
          <p className="typography-small text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending || isDemoPending}>
          {isPending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </div>
  )
}
