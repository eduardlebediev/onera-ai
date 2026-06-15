"use server"

import { redirect } from "next/navigation"

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
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "Invalid email or password." }
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
  if (!DEMO_LOGIN_ENABLED) {
    return { error: "Demo login is not enabled." }
  }

  const role = parseDemoRole(formData.get("role"))

  if (!role) {
    return { error: "Select a valid demo account." }
  }

  const account = DEMO_ACCOUNTS[role]
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_PASSWORD,
  })

  if (error) {
    return { error: "Demo login is unavailable. Check that demo users are seeded." }
  }

  redirect(account.redirectTo)
}
