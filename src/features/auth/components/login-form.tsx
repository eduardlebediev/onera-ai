"use client"

import { useActionState } from "react"

import { loginAction, type LoginState } from "@/features/auth/actions/login"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Logo } from "@/shared/ui/logo"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, null)

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center [&_span]:text-foreground">
        <Logo />
        <div className="space-y-1">
          <h1 className="typography-h2 text-foreground">Sign in to Ontera AI</h1>
          <p className="typography-small text-muted-foreground">
            Invite-only access. Contact your administrator if you need an account.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="email" className="typography-small font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="typography-small font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••"
          />
        </div>

        {state?.error ? (
          <p className="typography-small text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
