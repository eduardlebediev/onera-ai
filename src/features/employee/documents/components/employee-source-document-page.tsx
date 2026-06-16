"use client"

import { BookOpen, Download } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { useState } from "react"
import remarkGfm from "remark-gfm"

import type { EmployeeSourceDocumentView } from "@/features/employee/documents/lib/get-employee-source-document"
import { requestEmployeeDocumentDownloadUrl } from "@/features/employee/documents/lib/employee-document-api-client"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeSourceDocumentPageProps {
  document: EmployeeSourceDocumentView
  testId?: string
  backHref: string
  backLabel: string
}

export function EmployeeSourceDocumentPage({
  document,
  testId,
  backHref,
  backLabel,
}: EmployeeSourceDocumentPageProps) {
  const { t } = useTranslation()
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    setDownloadError(null)
    setIsDownloading(true)

    try {
      const signedUrl = await requestEmployeeDocumentDownloadUrl(document.id, testId)
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : t("employee.sourceDocument.downloadFailed")
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="page-shell-narrow">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: t("breadcrumbs.myTests"), href: "/employee/tests" },
          { label: backLabel, href: backHref },
          { label: t("breadcrumbs.sourceMaterial") },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" />
                <h1 className="typography-h2">{document.title}</h1>
              </div>
              {document.description ? (
                <p className="typography-p text-muted-foreground">{document.description}</p>
              ) : null}
            </div>

            {document.canDownloadOriginal ? (
              <div className="flex flex-col items-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDownloading}
                  onClick={() => void handleDownload()}
                >
                  <Download />
                  {isDownloading
                    ? t("employee.sourceDocument.preparing")
                    : t("employee.sourceDocument.downloadOriginal")}
                </Button>
                {downloadError ? (
                  <span className="text-xs text-destructive">{downloadError}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {document.extractedText ? (
            <div className="prose prose-sm max-w-none rounded-xl border border-border/50 bg-background/60 p-4 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{document.extractedText}</ReactMarkdown>
            </div>
          ) : (
            <p className="typography-p text-muted-foreground">
              {t("employee.sourceDocument.textUnavailable")}
              {document.canDownloadOriginal ? t("employee.sourceDocument.downloadInstead") : null}
            </p>
          )}

          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
