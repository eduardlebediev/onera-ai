import type {
  DashboardDocumentDisplayStatus,
  DashboardDocument,
  DashboardTestStatus,
} from "@/features/analytics/types/admin-dashboard"
import type { createTranslator } from "@/shared/i18n/translate"

export type DashboardDocumentStatusIcon = "check" | "loader" | "x" | "none"

export interface StatusBadgeConfig {
  label: string
  className: string
}

export interface DashboardDocumentStatusBadgeConfig extends StatusBadgeConfig {
  icon: DashboardDocumentStatusIcon
}

type Translator = ReturnType<typeof createTranslator>["t"]

const DOCUMENT_STATUS_LABEL_KEYS: Record<
  DashboardDocumentDisplayStatus,
  `status.document.${DashboardDocumentDisplayStatus}`
> = {
  ready: "status.document.ready",
  processing: "status.document.processing",
  failed: "status.document.failed",
  uploaded: "status.document.uploaded",
  archived: "status.document.archived",
  deleted: "status.document.deleted",
}

const DASHBOARD_TEST_STATUS_LABEL_KEYS: Record<
  DashboardTestStatus,
  "status.test.published" | "status.test.draft" | "status.test.archived"
> = {
  active: "status.test.published",
  draft: "status.test.draft",
  archived: "status.test.archived",
}

export function getDashboardDocumentDisplayStatus(
  document: DashboardDocument
): DashboardDocumentDisplayStatus {
  return document.displayStatus ?? document.status
}

export function getDashboardDocumentStatusBadgeConfig(
  status: DashboardDocumentDisplayStatus,
  t: Translator
): DashboardDocumentStatusBadgeConfig {
  const map: Record<
    DashboardDocumentDisplayStatus,
    Omit<DashboardDocumentStatusBadgeConfig, "label">
  > = {
    ready: {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: "check",
    },
    processing: {
      className: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "loader",
    },
    failed: {
      className: "bg-red-100 text-red-700 border-red-200",
      icon: "x",
    },
    uploaded: {
      className: "",
      icon: "none",
    },
    archived: {
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: "none",
    },
    deleted: {
      className: "bg-slate-100 text-slate-500 border-slate-200",
      icon: "none",
    },
  }

  return {
    label: t(DOCUMENT_STATUS_LABEL_KEYS[status]),
    ...map[status],
  }
}

export function getDocumentActionLabel(document: DashboardDocument, t: Translator) {
  const status = getDashboardDocumentDisplayStatus(document)

  if (status === "failed") return t("admin.dashboard.documentActions.retry")
  if (document.testCount === 0 && status === "ready") {
    return t("admin.dashboard.documentActions.createTest")
  }
  return t("admin.dashboard.documentActions.view")
}

export function getDashboardTestStatusBadgeConfig(
  status: DashboardTestStatus,
  t: Translator
): StatusBadgeConfig {
  const map: Record<DashboardTestStatus, Omit<StatusBadgeConfig, "label">> = {
    active: {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    draft: {
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    archived: {
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  }

  return {
    label: t(DASHBOARD_TEST_STATUS_LABEL_KEYS[status]),
    ...map[status],
  }
}

export function getScoreColorClass(score: number) {
  if (score >= 75) return "text-emerald-600"
  if (score >= 50) return "text-amber-600"
  return "text-red-600"
}
