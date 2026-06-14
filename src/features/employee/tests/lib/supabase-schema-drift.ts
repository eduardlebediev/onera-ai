type SupabaseQueryError = {
  code?: string
  message?: string
}

export function isMissingMaxAttemptsColumnError(
  error: SupabaseQueryError | null | undefined
): boolean {
  const message = error?.message ?? ""

  return (
    Boolean(error) &&
    (error?.code === "42703" ||
      error?.code === "PGRST204" ||
      (message.includes("max_attempts") &&
        (message.includes("does not exist") || message.includes("schema cache"))))
  )
}

export function warnMissingMaxAttemptsFallback(): void {
  console.warn(
    "tests.max_attempts is not available yet; defaulting employee attempt limits to 3. Apply supabase/migrations/00011_retake_and_transactions.sql to enable configured max attempts."
  )
}
