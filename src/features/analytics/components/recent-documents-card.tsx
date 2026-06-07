import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react"

import type { DocumentDisplayStatus, MockDocument } from "@/data/mock/admin-dashboard"
import {
  getDocumentActionLabel,
  getDocumentDisplayStatus,
  getDocumentStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function DocumentStatusBadge({ status }: { status: DocumentDisplayStatus }) {
  const badgeConfig = getDocumentStatusBadgeConfig(status)

  if (status === "uploaded") {
    return <span className="typography-small font-medium">{badgeConfig.label}</span>
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
          <h3 className="typography-h3">Recent Documents</h3>
          <div className="ml-auto">
            <Button variant="link" size="sm">
              View all &gt;
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-left">
          <TableHeader>
            <TableRow className="text-muted-foreground">
              <TableHead className="py-3">
                <span className="typography-small font-medium text-muted-foreground">Document</span>
              </TableHead>
              <TableHead className="py-3">
                <span className="typography-small font-medium text-muted-foreground">Status</span>
              </TableHead>
              <TableHead className="py-3">
                <span className="typography-small font-medium text-muted-foreground">Topics</span>
              </TableHead>
              <TableHead className="py-3">
                <span className="typography-small font-medium text-muted-foreground">Tests</span>
              </TableHead>
              <TableHead className="py-3">
                <span className="typography-small font-medium text-muted-foreground">Updated</span>
              </TableHead>
              <TableHead className="py-3 text-right">
                <span className="typography-small font-medium text-muted-foreground">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <p className="typography-small font-medium">{document.title}</p>
                </TableCell>
                <TableCell>
                  <DocumentStatusBadge status={getDocumentDisplayStatus(document)} />
                </TableCell>
                <TableCell>
                  <p className="typography-small font-medium text-muted-foreground">
                    {document.topics.length > 0 ? document.topics.length : "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="typography-small font-medium text-muted-foreground">
                    {document.quizCount > 0 ? document.quizCount : "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="typography-small font-medium text-muted-foreground">
                    {document.updatedAt}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    {getDocumentActionLabel(document)}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
