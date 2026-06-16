"use server"

import { redirect } from "next/navigation"

import { getLocale } from "@/shared/i18n/get-locale"
import { createTranslator } from "@/shared/i18n/translate"
import { createClient } from "@/lib/supabase/server"

export type LoginState = {
  error: string
} | null

type DemoRole = "admin" | "employee"

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"
const DEMO_PASSWORD = "demo-only-password"

const DEMO_ACCOUNTS: Record<DemoRole, { email: string; redirectTo: string }> = {
  admin: {
    email: "admin@demo.ontera.ai",
    redirectTo: "/admin/dashboard",
  },
  employee: {
    email: "employee@demo.ontera.ai",
    redirectTo: "/employee/dashboard",
  },
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const locale = await getLocale()
  const { t } = createTranslator(locale)
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: t("auth.errors.emailPasswordRequired") }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: t("auth.errors.invalidCredentials") }
  }

  redirect("/")
}

function parseDemoRole(value: FormDataEntryValue | null): DemoRole | null {
  if (value === "admin" || value === "employee") {
    return value
  }

  return null
}

export async function demoLoginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const locale = await getLocale()
  const { t } = createTranslator(locale)

  if (!DEMO_LOGIN_ENABLED) {
    return { error: t("auth.errors.demoNotEnabled") }
  }

  const role = parseDemoRole(formData.get("role"))

  if (!role) {
    return { error: t("auth.errors.invalidDemoAccount") }
  }

  const account = DEMO_ACCOUNTS[role]
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_PASSWORD,
  })

  if (error) {
    return { error: t("auth.errors.demoUnavailable") }
  }

  redirect(account.redirectTo)
}
