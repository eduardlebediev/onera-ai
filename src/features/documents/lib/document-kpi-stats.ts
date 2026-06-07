import type { MockDocumentDetail } from "@/data/mock/documents"

export interface DocumentKpiStat {
  label: string
  value: string
  description: string
}

export function getDocumentKpiStats(documents: MockDocumentDetail[]): DocumentKpiStat[] {
  const readyCount = documents.filter((d) => d.status === "ready").length
  const processingCount = documents.filter((d) => d.status === "processing").length
  const failedCount = documents.filter((d) => d.status === "failed").length

  return [
    {
      label: "Total Documents",
      value: String(documents.length),
      description: "18.2 GB total size",
    },
    {
      label: "Ready",
      value: String(readyCount),
      description: "Ready for assessment",
    },
    {
      label: "Processing",
      value: String(processingCount),
      description: "Currently processing",
    },
    {
      label: "Failed",
      value: String(failedCount),
      description: "Needs attention",
    },
  ]
}
