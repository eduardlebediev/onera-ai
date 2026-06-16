"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  MoreHorizontal,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import type {
  DocumentStatus,
  DocumentTopic,
  DocumentDetail,
} from "@/features/documents/types/document"
import { DocumentDownloadButton } from "@/features/documents/components/document-download-button"
import {
  DocumentLifecycleActions,
  type DocumentLifecycleCompleteHandler,
} from "@/features/documents/components/document-lifecycle-actions"
import { DocumentVersionBadge } from "@/features/documents/components/document-version-badge"
import { DocumentVersionHistory } from "@/features/documents/components/document-version-history"
import { canGenerateTest } from "@/features/documents/components/generate-test-model"
import { getDocumentStatusLabel } from "@/features/documents/lib/document-status-style"
import { UpdateDocumentDropdownItem } from "@/features/documents/components/update-document-dropdown-item"
import { UploadDocumentVersionButton } from "@/features/documents/components/upload-document-version-button"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { formatDate as formatLocaleDate } from "@/shared/i18n/format"
import { useTranslation } from "@/shared/i18n/use-translation"
import type { TranslationKey } from "@/shared/i18n/translate"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

interface DocumentDetailProps {
  document: DocumentDetail
  onLifecycleComplete?: DocumentLifecycleCompleteHandler
  showBreadcrumbs?: boolean
}

const STATUS_ICONS: Record<DocumentStatus, React.ReactNode> = {
  ready: <CheckCircle2 className="mr-1 size-3" />,
  processing: <Clock className="mr-1 size-3 animate-spin" />,
  failed: <XCircle className="mr-1 size-3" />,
  uploaded: null,
  archived: <AlertTriangle className="mr-1 size-3" />,
  deleted: <Trash2 className="mr-1 size-3" />,
}

const STATUS_BADGE_CLASS: Record<DocumentStatus, string> = {
  ready:
    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  processing:
    "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  failed: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  uploaded: "bg-muted text-muted-foreground hover:bg-muted",
  archived:
    "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  deleted: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
}

const TOPIC_BADGE_COLORS = [
  "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  "bg-purple-50 text-purple-700 hover:bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  "bg-orange-50 text-orange-700 hover:bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
  "bg-pink-50 text-pink-700 hover:bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400",
  "bg-teal-50 text-teal-700 hover:bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
]

const EXTRACTED_TEXT_MARKDOWN_CLASS_NAME = [
  "space-y-3 leading-6 text-muted-foreground",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_code]:rounded-md [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-foreground",
  "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground",
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_h4]:font-semibold [&_h4]:text-foreground",
  "[&_hr]:border-border",
  "[&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_p]:text-muted-foreground",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
  "[&_th]:border [&_th]:border-border [&_th]:bg-background [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground",
].join(" ")

interface ExtractedTextMarkdownProps {
  children: string
  preview?: boolean
}

function ExtractedTextMarkdown({ children, preview = false }: ExtractedTextMarkdownProps) {
  return (
    <div
      className={`${preview ? "max-h-40 overflow-hidden" : "overflow-x-auto"} ${EXTRACTED_TEXT_MARKDOWN_CLASS_NAME}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

function formatDate(locale: ReturnType<typeof useTranslation>["locale"], dateStr: string): string {
  return formatLocaleDate(locale, dateStr)
}

function getDocumentTopics(document: DocumentDetail): DocumentTopic[] {
  if (document.documentTopics && document.documentTopics.length > 0) {
    return document.documentTopics
  }

  return document.topics.map((topic) => ({
    topic,
    description: null,
    confidence: null,
  }))
}

function formatConfidence(
  confidence: number | null | undefined,
  t: ReturnType<typeof useTranslation>["t"]
): string | null {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return null
  }

  return t("common.confidence", { percent: Math.round(confidence * 100) })
}

export function DocumentDetail({
  document,
  onLifecycleComplete,
  showBreadcrumbs = true,
}: DocumentDetailProps) {
  const { locale, t } = useTranslation()
  const statusIcon = STATUS_ICONS[document.status]
  const statusBadgeClass = STATUS_BADGE_CLASS[document.status]
  const isDeleted = document.status === "deleted"
  const isArchived = document.status === "archived"
  const isReady = !isDeleted && !isArchived && canGenerateTest(document)
  const canDownload = !isDeleted && document.canDownloadOriginal === true
  const versionNumber = document.versionNumber ?? document.versions[0]?.version ?? 1
  const isLatestVersion = document.isLatestVersion !== false
  const latestDocumentId = document.latestDocumentId ?? document.id
  const canUploadNewVersion =
    !isDeleted && !isArchived && document.sourceType === "upload" && isLatestVersion
  const documentTopics = getDocumentTopics(document)
  const fileSizeLabel =
    document.fileSizeMb >= 1
      ? `${document.fileSizeMb.toFixed(1)} MB`
      : `${Math.round(document.fileSizeMb * 1024)} KB`

  return (
    <div className="page-shell-narrow">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="typography-h1">{document.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <DocumentVersionBadge versionNumber={versionNumber} isLatest={isLatestVersion} />
            <span className="text-border">|</span>
            <Badge variant="secondary" className={statusBadgeClass}>
              {statusIcon}
              {getDocumentStatusLabel(document.status, t)}
            </Badge>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1.5">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground uppercase text-xs">
                {document.fileType}
              </span>
            </div>
            <span className="text-border">|</span>
            <span>{fileSizeLabel}</span>
            <span className="text-border">|</span>
            <span>
              {t("documents.detail.uploaded", { date: formatDate(locale, document.uploadedAt) })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDeleted ? (
            <DocumentDownloadButton documentId={document.id} disabled={!canDownload} />
          ) : null}
          {!isDeleted ? (
            <Button asChild={isReady} disabled={!isReady}>
              {isReady ? (
                <Link href={`/admin/documents/${document.id}/generate-test`}>
                  <Sparkles />
                  {t("documents.detail.generateTest")}
                </Link>
              ) : (
                <>
                  <Sparkles />
                  {t("documents.detail.generateTest")}
                </>
              )}
            </Button>
          ) : null}
          {!isDeleted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t("documents.detail.moreActions")}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <UpdateDocumentDropdownItem
                  documentId={document.id}
                  disabled={!canUploadNewVersion}
                />
                <DocumentLifecycleActions
                  document={document}
                  onLifecycleComplete={onLifecycleComplete}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {showBreadcrumbs ? (
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t("nav.documents"), href: "/admin/documents" },
            { label: document.title },
          ]}
        />
      ) : null}

      {isDeleted ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-medium">{t("documents.detail.deletedBanner.title")}</p>
          <p className="mt-1">{t("documents.detail.deletedBanner.body")}</p>
          {document.deletionReason ? (
            <p className="mt-2 text-muted-foreground">
              {t("documents.detail.deletedBanner.reason", { reason: document.deletionReason })}
            </p>
          ) : null}
        </div>
      ) : isArchived ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-medium">{t("documents.detail.archivedBanner.title")}</p>
          <p className="mt-1">{t("documents.detail.archivedBanner.body")}</p>
        </div>
      ) : !isLatestVersion ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">{t("documents.detail.outdatedVersionBanner.title")}</p>
              <p className="mt-1">{t("documents.detail.outdatedVersionBanner.body")}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/documents/${latestDocumentId}`}>
              {t("documents.detail.outdatedVersionBanner.openLatest")}
            </Link>
          </Button>
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">{t("documents.detail.tabs.overview")}</TabsTrigger>
          {!isDeleted ? (
            <TabsTrigger value="extracted-text">
              {t("documents.detail.tabs.extractedText")}
            </TabsTrigger>
          ) : null}
          {!isDeleted ? (
            <TabsTrigger value="topics">
              {t("documents.detail.tabs.topics", { count: documentTopics.length })}
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="metadata">{t("documents.detail.tabs.metadata")}</TabsTrigger>
          <TabsTrigger value="versions">
            {t("documents.detail.tabs.versions", { count: document.versions.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-muted-foreground" />
                      <CardTitle>{t("documents.detail.summary.title")}</CardTitle>
                    </div>
                    <CardDescription>{t("documents.detail.summary.description")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="typography-p">{document.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("documents.detail.summary.aiSummaryHint")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("documents.detail.processingStatus.title")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProcessingStatusTimeline
                      status={document.status}
                      processingError={document.processingError}
                      t={t}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t("documents.detail.versionNotes.title")}</CardTitle>
                  <CardDescription>
                    {t("documents.detail.versionNotes.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {document.changeMessage ? (
                    <div>
                      <p className="font-medium text-foreground">
                        {t("documents.detail.versionNotes.changeMessage")}
                      </p>
                      <p className="mt-1 text-muted-foreground">{document.changeMessage}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {versionNumber === 1
                        ? t("documents.detail.versionNotes.initialUpload")
                        : t("documents.detail.versionNotes.noChangeMessage")}
                    </p>
                  )}
                  {document.aiChangeSummary ? (
                    <div>
                      <p className="font-medium text-foreground">
                        {t("documents.detail.versionNotes.aiChangeSummary")}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {document.aiChangeSummary}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <CardTitle>{t("documents.detail.extractedTextPreview")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.extractedText ? (
                    <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                      <ExtractedTextMarkdown preview>
                        {document.extractedText}
                      </ExtractedTextMarkdown>
                    </div>
                  ) : document.chunks.length > 0 ? (
                    <>
                      <div className="space-y-4 rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                        {document.chunks.slice(0, 2).map((chunk) => (
                          <div key={chunk.id}>
                            <div className="mb-1 font-medium text-foreground">{chunk.topic}</div>
                            <p className="line-clamp-3">{chunk.content}</p>
                          </div>
                        ))}
                        {document.chunks.length > 2 && (
                          <p className="opacity-50">
                            {t("common.moreChunks", {
                              count: document.chunks.length - 2,
                              plural: document.chunks.length - 2 === 1 ? "" : "s",
                            })}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {document.status === "processing"
                        ? t("documents.detail.processingStatus.inProgress")
                        : document.status === "failed"
                          ? t("documents.detail.processingStatus.failed")
                          : t("documents.detail.processingStatus.none")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>{t("documents.detail.aiExtractedTopics")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {documentTopics.length > 0
                      ? t("documents.detail.topicsIdentified", { count: documentTopics.length })
                      : t("documents.detail.noTopicsYet")}
                  </div>
                  {documentTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {documentTopics.map((topicItem, i) => (
                        <Badge
                          key={topicItem.id ?? topicItem.topic}
                          variant="secondary"
                          className={TOPIC_BADGE_COLORS[i % TOPIC_BADGE_COLORS.length]}
                        >
                          <div className="mr-1.5 size-1.5 rounded-full bg-current opacity-60" />
                          {topicItem.topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("documents.detail.noTopicsYet")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("documents.detail.documentDetails")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.version")}
                      </span>
                      <span className="font-medium text-foreground">
                        {t("common.version", { number: versionNumber })}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.latest")}
                      </span>
                      <span className="font-medium text-foreground">
                        {isLatestVersion ? t("common.yes") : t("common.no")}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.fileName")}
                      </span>
                      <span className="font-medium text-foreground truncate">
                        {document.fileName ?? document.title}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.fileType")}
                      </span>
                      <span className="font-medium text-foreground uppercase">
                        {document.fileType}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.fileSize")}
                      </span>
                      <span className="font-medium text-foreground">{fileSizeLabel}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.topics")}
                      </span>
                      <span className="font-medium text-foreground">{document.topics.length}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("documents.detail.metadata.chunks")}
                      </span>
                      <span className="font-medium text-foreground">{document.chunks.length}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">
                        {t("status.processingSteps.uploaded")}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDate(locale, document.uploadedAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">{t("dataTable.status")}</span>
                      <span className="font-medium text-foreground capitalize">
                        {getDocumentStatusLabel(document.status, t)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    {!isDeleted ? (
                      <>
                        <UploadDocumentVersionButton
                          documentId={document.id}
                          disabled={!canUploadNewVersion}
                        />
                        {!canUploadNewVersion ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t("documents.detail.newVersionHint")}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {!isDeleted ? (
          <TabsContent value="extracted-text">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <CardTitle>{t("documents.detail.fullExtractedText")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {document.extractedText ? (
                  <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                    <ExtractedTextMarkdown>{document.extractedText}</ExtractedTextMarkdown>
                  </div>
                ) : document.chunks.length > 0 ? (
                  <div className="space-y-6">
                    {document.chunks.map((chunk, index) => (
                      <div key={chunk.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("documents.detail.chunkLabel", { number: index + 1 })}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs font-medium text-foreground">{chunk.topic}</span>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                          {chunk.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {document.status === "processing"
                      ? t("documents.detail.processingStatus.inProgress")
                      : document.status === "failed"
                        ? t("documents.detail.processingStatus.failed")
                        : t("documents.detail.processingStatus.none")}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {!isDeleted ? (
          <TabsContent value="topics">
            <Card>
              <CardHeader>
                <CardTitle>{t("documents.detail.aiExtractedTopics")}</CardTitle>
                <CardDescription>{t("documents.detail.topicsTabDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {documentTopics.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {documentTopics.map((topicItem, i) => {
                      const confidenceLabel = formatConfidence(topicItem.confidence, t)
                      const topicChunks = document.chunks.filter((c) => c.topic === topicItem.topic)

                      return (
                        <div
                          key={topicItem.id ?? topicItem.topic}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-1.5 size-2 shrink-0 rounded-full ${TOPIC_BADGE_COLORS[i % TOPIC_BADGE_COLORS.length].split(" ")[0].replace("bg-", "bg-").replace("-50", "-500")}`}
                              />
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">{topicItem.topic}</div>
                                {topicItem.description ? (
                                  <p className="text-sm text-muted-foreground">
                                    {topicItem.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {confidenceLabel ? (
                                <Badge variant="outline">{confidenceLabel}</Badge>
                              ) : null}
                              {topicChunks.length > 0 ? (
                                <span>
                                  {t("common.chunks", {
                                    count: topicChunks.length,
                                    plural: topicChunks.length === 1 ? "" : "s",
                                  })}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No topics extracted yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>{t("documents.detail.metadata.title")}</CardTitle>
              <CardDescription>{t("documents.detail.metadata.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.titleLabel")}
                  </span>
                  <span className="text-sm text-foreground">{document.title}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.fileName")}
                  </span>
                  <span className="text-sm text-foreground">
                    {document.fileName ?? document.title}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.extractionMethod")}
                  </span>
                  <span className="text-sm text-foreground">
                    {document.extractionMethod ?? t("common.dash")}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.processed")}
                  </span>
                  <span className="text-sm text-foreground">
                    {document.processedAt
                      ? formatDate(locale, document.processedAt)
                      : t("common.dash")}
                  </span>
                </div>
                {document.processingError ? (
                  <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("documents.detail.metadata.processingError")}
                    </span>
                    <span className="text-sm text-destructive">{document.processingError}</span>
                  </div>
                ) : null}
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.fileType")}
                  </span>
                  <span className="text-sm text-foreground uppercase">{document.fileType}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.fileSize")}
                  </span>
                  <span className="text-sm text-foreground">{fileSizeLabel}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("dataTable.status")}
                  </span>
                  <span className="text-sm text-foreground capitalize">
                    {getDocumentStatusLabel(document.status, t)}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.processed")}
                  </span>
                  <span className="text-sm text-foreground">
                    {formatDate(locale, document.uploadedAt)}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.version")}
                  </span>
                  <span className="text-sm text-foreground">
                    {t("common.version", { number: versionNumber })}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("documents.detail.metadata.versionState")}
                  </span>
                  <span className="text-sm text-foreground">
                    {isLatestVersion
                      ? t("documents.detail.metadata.latestVersion")
                      : t("documents.detail.metadata.oldVersion")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>{t("documents.detail.versionHistory.title")}</CardTitle>
              <CardDescription>{t("documents.detail.versionHistory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVersionHistory versions={document.versions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProcessingStatusTimeline({
  status,
  processingError,
  t,
}: {
  status: DocumentStatus
  processingError?: string | null
  t: ReturnType<typeof useTranslation>["t"]
}) {
  const steps: Array<{ key: DocumentStatus | "complete"; labelKey: TranslationKey }> = [
    { key: "uploaded", labelKey: "status.processingSteps.uploaded" },
    { key: "processing", labelKey: "status.processingSteps.processing" },
    { key: "complete", labelKey: "status.processingSteps.analysisComplete" },
    { key: "ready", labelKey: "status.processingSteps.ready" },
  ]

  const completedStepKeys: Set<string> = new Set(
    status === "ready"
      ? ["uploaded", "processing", "complete", "ready"]
      : status === "processing"
        ? ["uploaded", "processing"]
        : status === "uploaded"
          ? ["uploaded"]
          : []
  )

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isDone = completedStepKeys.has(step.key)
        const isLast = index === steps.length - 1

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full p-1 ${isDone ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"}`}
              >
                {isDone ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="size-3.5 rounded-full border border-muted-foreground/30" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`my-1 h-full w-px ${isDone ? "bg-emerald-200 dark:bg-emerald-900/50" : "bg-border"}`}
                />
              )}
            </div>
            <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
              <div
                className={`text-sm font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}
              >
                {t(step.labelKey)}
              </div>
            </div>
          </div>
        )
      })}
      {status === "failed" && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <XCircle className="size-4 shrink-0" />
          {processingError ?? t("documents.detail.processingStatus.defaultError")}
        </div>
      )}
    </div>
  )
}
