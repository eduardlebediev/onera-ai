import Link from "next/link"

import type { DocumentVersion } from "@/features/documents/types/document"
import { DocumentVersionBadge } from "@/features/documents/components/document-version-badge"
import { formatDate } from "@/shared/i18n/format"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"

export function DocumentVersionHistory({ versions }: { versions: DocumentVersion[] }) {
  const { locale, t } = useTranslation()

  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("documents.detail.versionHistory.empty")}</p>
    )
  }

  return (
    <div className="space-y-6">
      {versions.map((version, index) => (
        <div key={version.id} className="relative pl-6">
          {index < versions.length - 1 ? (
            <div className="absolute left-2 top-4 h-full w-px bg-border" />
          ) : null}
          <div
            className={`absolute left-0 top-1.5 size-4 rounded-full border-2 bg-background ${
              version.isCurrent ? "border-primary" : "border-border"
            }`}
          />
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <DocumentVersionBadge
                  versionNumber={version.version}
                  isLatest={version.isLatest === true}
                />
                <p className="text-sm text-muted-foreground">
                  {t("documents.detail.versionHistory.uploaded", {
                    date: formatDate(locale, version.uploadedAt),
                  })}{" "}
                  · {version.status}
                  {version.isCurrent
                    ? ` · ${t("documents.detail.versionHistory.currentPage")}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/documents/${version.id}`}>
                    {t("documents.detail.versionHistory.openVersion")}
                  </Link>
                </Button>
                {version.newerVersionId ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/documents/${version.newerVersionId}`}>
                      {t("documents.detail.versionHistory.openNewerVersion")}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
            {version.changeMessage ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {t("documents.detail.versionNotes.changeMessage")}
                </p>
                <p className="mt-1 text-muted-foreground">{version.changeMessage}</p>
              </div>
            ) : null}
            {version.aiChangeSummary ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {t("documents.detail.versionNotes.aiChangeSummary")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {version.aiChangeSummary}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
