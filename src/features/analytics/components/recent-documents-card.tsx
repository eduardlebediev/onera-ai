"use client"

import Link from "next/link"
import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react"

import type {
  DashboardDocumentDisplayStatus,
  DashboardDocument,
} from "@/features/analytics/types/admin-dashboard"
import {
  getDocumentActionLabel,
  getDashboardDocumentDisplayStatus,
  getDashboardDocumentStatusBadgeConfig,
} from "@/features/analytics/lib/dashboard-formatters"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function DashboardDocumentStatusBadge({ status }: { status: DashboardDocumentDisplayStatus }) {
  const { t } = useTranslation()
  const badgeConfig = getDashboardDocumentStatusBadgeConfig(status, t)

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

function getDocumentActionHref(document: DashboardDocument): string {
  const status = getDashboardDocumentDisplayStatus(document)

  if (status === "failed") return `/admin/documents/${document.id}`
  if (document.testCount === 0 && status === "ready") {
    return `/admin/documents/${document.id}/generate-test`
  }
  return `/admin/documents/${document.id}`
}

interface RecentDocumentsCardProps {
  documents: DashboardDocument[]
}

export function RecentDocumentsCard({ documents }: RecentDocumentsCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="col-span-12 h-full lg:col-span-8">
      <CardHeader className="px-6 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <h3 className="typography-h3">{t("admin.dashboard.recentDocuments")}</h3>
          <div className="ml-auto">
            <Button variant="link" size="sm" asChild>
              <Link href="/admin/documents">{t("common.viewAll")}</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-6 py-8">
            <p className="typography-small font-medium text-foreground">
              {t("admin.dashboard.noDocumentsYet")}
            </p>
            <p className="typography-small text-muted-foreground">
              {t("admin.dashboard.noDocumentsHint")}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/documents">{t("admin.dashboard.uploadDocument")}</Link>
            </Button>
          </div>
        ) : (
          <Table className="text-left">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.document")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.status")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("documents.detail.metadata.topics")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("nav.tests")}
                  </span>
                </TableHead>
                <TableHead className="py-3">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("dataTable.updated")}
                  </span>
                </TableHead>
                <TableHead className="py-3 text-right">
                  <span className="typography-small font-medium text-muted-foreground">
                    {t("common.action")}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Link
                      href={`/admin/documents/${document.id}`}
                      className="typography-small font-medium hover:text-primary hover:underline"
                    >
                      {document.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DashboardDocumentStatusBadge
                      status={getDashboardDocumentDisplayStatus(document)}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {document.topics.length > 0 ? document.topics.length : t("common.dash")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {document.testCount > 0 ? document.testCount : t("common.dash")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="typography-small font-medium text-muted-foreground">
                      {document.updatedAt}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={getDocumentActionHref(document)}>
                        {getDocumentActionLabel(document, t)}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
