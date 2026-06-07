import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react"

import type { MockDocumentDetail } from "@/data/mock/documents"
import { getDocumentKpiStats } from "@/features/documents/lib/document-kpi-stats"
import { Card, CardContent } from "@/shared/ui/card"
import { Typography } from "@/shared/ui/typography"

interface DocumentsKpiSectionProps {
  documents: MockDocumentDetail[]
}

export function DocumentsKpiSection({ documents }: DocumentsKpiSectionProps) {
  const stats = getDocumentKpiStats(documents)

  const readyCount = documents.filter((d) => d.status === "ready").length
  const processingCount = documents.filter((d) => d.status === "processing").length
  const failedCount = documents.filter((d) => d.status === "failed").length

  const readyPercentage =
    documents.length > 0 ? ((readyCount / documents.length) * 100).toFixed(1) : "0.0"
  const processingPercentage =
    documents.length > 0 ? ((processingCount / documents.length) * 100).toFixed(1) : "0.0"
  const failedPercentage =
    documents.length > 0 ? ((failedCount / documents.length) * 100).toFixed(1) : "0.0"

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="min-h-24">
        <CardContent className="flex h-full items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted/50">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <Typography variant="small" className="font-medium text-foreground">
              Total Documents
            </Typography>
            <div className="flex items-baseline gap-1.5">
              <Typography variant="h2" as="span" className="font-semibold">
                {stats[0].value}
              </Typography>
              <Typography variant="small" as="span" className="text-muted-foreground">
                files
              </Typography>
            </div>
            <Typography variant="small" className="text-muted-foreground">
              {stats[0].description}
            </Typography>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-24">
        <CardContent className="flex h-full items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <Typography variant="small" className="font-medium text-foreground">
              Ready
            </Typography>
            <div className="flex items-baseline gap-2">
              <Typography variant="h2" as="span" className="font-semibold">
                {stats[1].value}
              </Typography>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {readyPercentage}%
              </span>
            </div>
            <Typography variant="small" className="text-muted-foreground">
              {stats[1].description}
            </Typography>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-24">
        <CardContent className="flex h-full items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
            <Clock className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex flex-col">
            <Typography variant="small" className="font-medium text-foreground">
              Processing
            </Typography>
            <div className="flex items-baseline gap-2">
              <Typography variant="h2" as="span" className="font-semibold">
                {stats[2].value}
              </Typography>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {processingPercentage}%
              </span>
            </div>
            <Typography variant="small" className="text-muted-foreground">
              {stats[2].description}
            </Typography>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-24">
        <CardContent className="flex h-full items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex flex-col">
            <Typography variant="small" className="font-medium text-foreground">
              Failed
            </Typography>
            <div className="flex items-baseline gap-2">
              <Typography variant="h2" as="span" className="font-semibold">
                {stats[3].value}
              </Typography>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {failedPercentage}%
              </span>
            </div>
            <Typography variant="small" className="text-muted-foreground">
              {stats[3].description}
            </Typography>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
