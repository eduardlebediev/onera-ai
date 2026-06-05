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
  const topicsCount = documents.reduce((sum, d) => sum + d.topicsCount, 0)
  const linkedTestsCount = documents.reduce((sum, d) => sum + d.linkedTests.length, 0)

  return [
    {
      label: "Total Documents",
      value: String(documents.length),
      description: `${readyCount} ready · ${processingCount} processing · ${failedCount} failed`,
    },
    {
      label: "Ready",
      value: String(readyCount),
      description: "Available for test generation",
    },
    {
      label: "Processing",
      value: String(processingCount),
      description: "Extracting topics and chunks",
    },
    {
      label: "Failed",
      value: String(failedCount),
      description: "Requires re-upload or review",
    },
    {
      label: "Topics Detected",
      value: String(topicsCount),
      description: "Across all documents",
    },
    {
      label: "Linked Tests",
      value: String(linkedTestsCount),
      description: "Published and draft tests",
    },
  ]
}
