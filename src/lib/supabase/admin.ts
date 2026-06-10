/**
 * Server-only Supabase admin client (secret key).
 * Do not import from Client Components or any browser code.
 */
import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { getSupabaseUrl } from "./env"
import type { Database } from "./types"

function getSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY

  if (!key) {
    throw new Error("Missing SUPABASE_SECRET_KEY")
  }

  return key
}

export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
