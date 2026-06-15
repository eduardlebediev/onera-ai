import { getDocumentKpiStats } from "@/features/documents/lib/document-kpi-stats"
import type { MockDocumentDetail } from "@/data/mock/documents"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface DocumentsKpiSectionProps {
  documents: MockDocumentDetail[]
}

export function DocumentsKpiSection({ documents }: DocumentsKpiSectionProps) {
  const stats = getDocumentKpiStats(documents).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={4} stats={stats} />
}
