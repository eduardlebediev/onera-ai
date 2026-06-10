/**
 * Server-only Supabase admin client (service role).
 * Do not import from Client Components or any browser code.
 */
import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { getSupabaseUrl } from "./env"
import type { Database } from "./types"

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return key
}

export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
