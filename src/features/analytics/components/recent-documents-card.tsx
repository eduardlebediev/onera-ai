import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react"

import type { DocumentDisplayStatus, MockDocument } from "@/data/mock/admin-dashboard"
import {
  getDocumentActionLabel,
  getDocumentDisplayStatus,
  getDocumentStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

function DocumentStatusBadge({ status }: { status: DocumentDisplayStatus }) {
  const badgeConfig = getDocumentStatusBadgeConfig(status)

  if (status === "uploaded") {
    return <span className="text-sm font-medium text-foreground">{badgeConfig.label}</span>
  }

  const Icon =
    badgeConfig.icon === "check" ? CheckCircle2 : badgeConfig.icon === "loader" ? Loader2 : XCircle

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeConfig.className}`}
    >
      <Icon className={`mr-1.5 size-3 ${badgeConfig.icon === "loader" ? "animate-spin" : ""}`} />
      {badgeConfig.label}
    </span>
  )
}

interface RecentDocumentsCardProps {
  documents: MockDocument[]
}

export function RecentDocumentsCard({ documents }: RecentDocumentsCardProps) {
  return (
    <Card className="col-span-12 h-full lg:col-span-8">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <CardTitle className="text-xl font-semibold">Recent Documents</CardTitle>
          <Button
            variant="link"
            size="sm"
            className="ml-auto h-auto p-0 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            View all &gt;
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-sm font-semibold text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Document</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Topics</th>
                <th className="px-6 py-3 font-semibold">Tests</th>
                <th className="px-6 py-3 font-semibold">Updated</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {documents.map((document) => (
                <tr key={document.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3 font-semibold text-foreground">{document.title}</td>
                  <td className="px-6 py-3">
                    <DocumentStatusBadge status={getDocumentDisplayStatus(document)} />
                  </td>
                  <td className="px-6 py-3 font-semibold text-muted-foreground">
                    {document.topics.length > 0 ? document.topics.length : "—"}
                  </td>
                  <td className="px-6 py-3 font-semibold text-muted-foreground">
                    {document.quizCount > 0 ? document.quizCount : "—"}
                  </td>
                  <td className="px-6 py-3 font-semibold text-muted-foreground">
                    {document.updatedAt}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                      {getDocumentActionLabel(document)}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
