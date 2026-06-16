import type { DocumentStatus } from "@/features/documents/types/document"

export interface DocumentStatusStyle {
  label: string
  dotClass: string
  badgeClass: string
}

export const DOCUMENT_STATUS_STYLE: Record<DocumentStatus, DocumentStatusStyle> = {
  ready: {
    label: "Ready",
    dotClass: "bg-green-500",
    badgeClass:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400",
  },
  processing: {
    label: "Processing",
    dotClass: "bg-orange-500",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  },
  uploaded: {
    label: "Uploaded",
    dotClass: "bg-muted-foreground",
    badgeClass: "border-border bg-muted text-muted-foreground",
  },
  archived: {
    label: "Archived",
    dotClass: "bg-amber-500",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400",
  },
  deleted: {
    label: "Deleted",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  },
}
