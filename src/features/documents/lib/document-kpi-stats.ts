import type { LucideIcon } from "lucide-react"
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react"

import type { MockDocumentDetail } from "@/data/mock/documents"

type DocumentKpiTone = "neutral" | "success" | "warning" | "danger"

export interface DocumentKpiStat {
  id: "total" | "ready" | "processing" | "failed"
  label: string
  value: string
  description: string
  icon: LucideIcon
  tone: DocumentKpiTone
  status?: MockDocumentDetail["status"]
}

export function getDocumentKpiStats(documents: MockDocumentDetail[]): DocumentKpiStat[] {
  const totalCount = documents.length
  const readyCount = documents.filter((d) => d.status === "ready").length
  const processingCount = documents.filter((d) => d.status === "processing").length
  const failedCount = documents.filter((d) => d.status === "failed").length

  return [
    {
      id: "total",
      label: "Total Documents",
      value: String(totalCount),
      description: "18.2 GB total size",
      icon: FileText,
      tone: "neutral",
    },
    {
      id: "ready",
      label: "Ready",
      value: String(readyCount),
      description: "Ready for assessment",
      icon: CheckCircle2,
      tone: "success",
      status: "ready",
    },
    {
      id: "processing",
      label: "Processing",
      value: String(processingCount),
      description: "Currently processing",
      icon: Clock,
      tone: "warning",
      status: "processing",
    },
    {
      id: "failed",
      label: "Failed",
      value: String(failedCount),
      description: "Needs attention",
      icon: AlertTriangle,
      tone: "danger",
      status: "failed",
    },
  ]
}
