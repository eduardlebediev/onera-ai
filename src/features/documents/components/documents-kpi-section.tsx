import { AlertTriangle, CheckCircle2, ClipboardList, FileText, Loader2, Tag } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { MockDocumentDetail } from "@/data/mock/documents"
import { getDocumentKpiStats } from "@/features/documents/lib/document-kpi-stats"
import { KpiCard } from "@/shared/ui/kpi-card"

const KPI_ICONS: Record<string, LucideIcon> = {
  "Total Documents": FileText,
  Ready: CheckCircle2,
  Processing: Loader2,
  Failed: AlertTriangle,
  "Topics Detected": Tag,
  "Linked Tests": ClipboardList,
}

interface DocumentsKpiSectionProps {
  documents: MockDocumentDetail[]
}

export function DocumentsKpiSection({ documents }: DocumentsKpiSectionProps) {
  const stats = getDocumentKpiStats(documents)

  return (
    <>
      {stats.map((stat) => {
        const Icon = KPI_ICONS[stat.label] ?? FileText
        const isFailed = stat.label === "Failed"

        return (
          <KpiCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={Icon}
            size="compact"
            {...(isFailed && failedCountIsNonZero(stat.value)
              ? { valueColor: "text-destructive" }
              : {})}
          />
        )
      })}
    </>
  )
}

function failedCountIsNonZero(value: string): boolean {
  return Number.parseInt(value, 10) > 0
}
