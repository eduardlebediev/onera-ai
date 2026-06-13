export const ARCHIVE_DELETE_MIGRATION_REQUIRED_MESSAGE =
  "Document archive/delete requires migration 00006. Apply supabase/migrations/00006_document_archive_delete_and_test_inactivation.sql before using this action."

type SupabaseLikeError = {
  code?: string
  message?: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as SupabaseLikeError).message
    return typeof message === "string" ? message : ""
  }

  return ""
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as SupabaseLikeError).code
    return typeof code === "string" ? code : undefined
  }

  return undefined
}

export function isArchiveDeleteMigrationError(error: unknown): boolean {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  if (code === "42703" || code === "PGRST204") {
    return true
  }

  const missingColumnNames = [
    "archived_at",
    "archived_by",
    "deleted_at",
    "deleted_by",
    "deletion_reason",
    "is_active",
    "source_validity",
    "source_invalid_reason",
    "source_invalid_at",
    "source_document_id",
    "source_status",
  ]

  if (
    missingColumnNames.some((column) => message.includes(column)) &&
    (message.includes("does not exist") || message.includes("schema cache"))
  ) {
    return true
  }

  return (
    message.includes("documents_status_check") ||
    message.includes("tests_source_validity_check") ||
    message.includes("test_questions_source_status_check")
  )
}
