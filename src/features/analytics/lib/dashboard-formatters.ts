import type { DocumentDisplayStatus, MockDocument, TestStatus } from "@/data/mock/admin-dashboard"

export type DocumentStatusIcon = "check" | "loader" | "x" | "none"

export interface StatusBadgeConfig {
  label: string
  className: string
}

export interface DocumentStatusBadgeConfig extends StatusBadgeConfig {
  icon: DocumentStatusIcon
}

export function getDocumentDisplayStatus(document: MockDocument): DocumentDisplayStatus {
  return document.displayStatus ?? document.status
}

export function getDocumentStatusBadgeConfig(
  status: DocumentDisplayStatus
): DocumentStatusBadgeConfig {
  const map: Record<DocumentDisplayStatus, DocumentStatusBadgeConfig> = {
    ready: {
      label: "Ready",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: "check",
    },
    processing: {
      label: "Processing",
      className: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "loader",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 border-red-200",
      icon: "x",
    },
    uploaded: {
      label: "Uploaded",
      className: "",
      icon: "none",
    },
  }

  return map[status]
}

export function getDocumentActionLabel(document: MockDocument) {
  if (document.status === "failed") return "Retry"
  if (document.testCount === 0 && document.status === "ready") return "Create Test"
  return "View"
}

export function getTestStatusBadgeConfig(status: TestStatus): StatusBadgeConfig {
  const map: Record<TestStatus, StatusBadgeConfig> = {
    active: {
      label: "Published",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    draft: {
      label: "Draft",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    archived: {
      label: "Archived",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  }

  return map[status]
}

export function getScoreColorClass(score: number) {
  if (score >= 75) return "text-emerald-600"
  if (score >= 50) return "text-amber-600"
  return "text-red-600"
}
