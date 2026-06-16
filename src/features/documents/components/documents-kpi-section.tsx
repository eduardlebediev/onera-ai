"use client"

import { getDocumentKpiStats } from "@/features/documents/lib/document-kpi-stats"
import type { DocumentDetail } from "@/features/documents/types/document"
import type { TranslationKey } from "@/shared/i18n/use-translation"
import { useTranslation } from "@/shared/i18n/use-translation"
import { KpiStatGrid } from "@/shared/ui/kpi-stat-grid"

interface DocumentsKpiSectionProps {
  documents: DocumentDetail[]
}

function getDocumentKpiLabelKey(id: string): TranslationKey {
  const keyMap: Record<string, TranslationKey> = {
    total: "kpi.documents.totalDocuments",
    ready: "kpi.documents.ready",
    processing: "kpi.documents.processing",
    failed: "kpi.documents.failed",
  }

  return keyMap[id] ?? "kpi.documents.totalDocuments"
}

export function DocumentsKpiSection({ documents }: DocumentsKpiSectionProps) {
  const { t } = useTranslation()
  const stats = getDocumentKpiStats(documents).map((item) => ({
    id: item.id,
    label: t(getDocumentKpiLabelKey(item.id)),
    value: item.value,
    icon: item.icon,
    tone: item.tone,
  }))

  return <KpiStatGrid columns={4} stats={stats} />
}
