import type { DocumentStatus } from "@/features/documents/types/document"
import type { createTranslator } from "@/shared/i18n/translate"

export interface DocumentStatusStyle {
  labelKey: `status.document.${DocumentStatus}`
  dotClass: string
  badgeClass: string
}

export const DOCUMENT_STATUS_STYLE: Record<DocumentStatus, DocumentStatusStyle> = {
  ready: {
    labelKey: "status.document.ready",
    dotClass: "bg-green-500",
    badgeClass:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400",
  },
  processing: {
    labelKey: "status.document.processing",
    dotClass: "bg-orange-500",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400",
  },
  failed: {
    labelKey: "status.document.failed",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  },
  uploaded: {
    labelKey: "status.document.uploaded",
    dotClass: "bg-muted-foreground",
    badgeClass: "border-border bg-muted text-muted-foreground",
  },
  archived: {
    labelKey: "status.document.archived",
    dotClass: "bg-amber-500",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400",
  },
  deleted: {
    labelKey: "status.document.deleted",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  },
}

export function getDocumentStatusLabel(
  status: DocumentStatus,
  t: ReturnType<typeof createTranslator>["t"]
): string {
  return t(DOCUMENT_STATUS_STYLE[status].labelKey)
}
