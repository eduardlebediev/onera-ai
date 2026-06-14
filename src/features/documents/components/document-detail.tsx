"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  MoreHorizontal,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react"
import Link from "next/link"

import type { DocumentStatus, DocumentTopic, MockDocumentDetail } from "@/data/mock/documents"
import { DocumentDownloadButton } from "@/features/documents/components/document-download-button"
import {
  DocumentLifecycleActions,
  type DocumentLifecycleCompleteHandler,
} from "@/features/documents/components/document-lifecycle-actions"
import { DocumentVersionBadge } from "@/features/documents/components/document-version-badge"
import { DocumentVersionHistory } from "@/features/documents/components/document-version-history"
import { canGenerateTest } from "@/features/documents/components/generate-test-model"
import { UpdateDocumentDropdownItem } from "@/features/documents/components/update-document-dropdown-item"
import { UploadDocumentVersionButton } from "@/features/documents/components/upload-document-version-button"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

interface DocumentDetailProps {
  document: MockDocumentDetail
  onLifecycleComplete?: DocumentLifecycleCompleteHandler
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  ready: {
    label: "Ready",
    icon: <CheckCircle2 className="mr-1 size-3" />,
    className:
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  processing: {
    label: "Processing",
    icon: <Clock className="mr-1 size-3 animate-spin" />,
    className:
      "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="mr-1 size-3" />,
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
  uploaded: {
    label: "Uploaded",
    icon: null,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  archived: {
    label: "Archived",
    icon: <AlertTriangle className="mr-1 size-3" />,
    className:
      "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  },
  deleted: {
    label: "Deleted",
    icon: <Trash2 className="mr-1 size-3" />,
    className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
}

const TOPIC_BADGE_COLORS = [
  "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  "bg-purple-50 text-purple-700 hover:bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
  "bg-orange-50 text-orange-700 hover:bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
  "bg-pink-50 text-pink-700 hover:bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400",
  "bg-teal-50 text-teal-700 hover:bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getDocumentTopics(document: MockDocumentDetail): DocumentTopic[] {
  if (document.documentTopics && document.documentTopics.length > 0) {
    return document.documentTopics
  }

  return document.topics.map((topic) => ({
    topic,
    description: null,
    confidence: null,
  }))
}

function formatConfidence(confidence: number | null | undefined): string | null {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return null
  }

  return `${Math.round(confidence * 100)}%`
}

export function DocumentDetail({ document, onLifecycleComplete }: DocumentDetailProps) {
  const statusConfig = STATUS_CONFIG[document.status]
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
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/documents" className="hover:text-foreground">
          Documents
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{document.title}</span>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="typography-h1">{document.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <DocumentVersionBadge versionNumber={versionNumber} isLatest={isLatestVersion} />
            <span className="text-border">|</span>
            <Badge variant="secondary" className={statusConfig.className}>
              {statusConfig.icon}
              {statusConfig.label}
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
            <span>Uploaded {formatDate(document.uploadedAt)}</span>
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
                  Generate Test
                </Link>
              ) : (
                <>
                  <Sparkles />
                  Generate Test
                </>
              )}
            </Button>
          ) : null}
          {!isDeleted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <UpdateDocumentDropdownItem
                  documentId={document.id}
                  disabled={!canUploadNewVersion}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {isDeleted ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-medium">This document was permanently deleted.</p>
          <p className="mt-1">
            The uploaded file, extracted text, chunks, and topics were removed. This page remains as
            a reference for tests that used this source document.
          </p>
          {document.deletionReason ? (
            <p className="mt-2 text-muted-foreground">Reason: {document.deletionReason}</p>
          ) : null}
        </div>
      ) : isArchived ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-medium">This document is archived.</p>
          <p className="mt-1">
            It is no longer available for test generation. Dependent tests are inactive until
            reviewed. Completed results remain available.
          </p>
        </div>
      ) : !isLatestVersion ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">A newer version of this document exists.</p>
              <p className="mt-1">New tests should usually use the latest ready version.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/documents/${latestDocumentId}`}>Open latest version</Link>
          </Button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
          This is the latest version.
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {!isDeleted ? <TabsTrigger value="extracted-text">Extracted Text</TabsTrigger> : null}
          {!isDeleted ? (
            <TabsTrigger value="topics">Topics ({documentTopics.length})</TabsTrigger>
          ) : null}
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="versions">Versions ({document.versions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-muted-foreground" />
                      <CardTitle>Document Summary</CardTitle>
                    </div>
                    <CardDescription>From document metadata</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="typography-p">{document.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Full AI-generated summary available after processing.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Processing Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProcessingStatusTimeline
                      status={document.status}
                      processingError={document.processingError}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Version Notes</CardTitle>
                  <CardDescription>Change context for this document version.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {document.changeMessage ? (
                    <div>
                      <p className="font-medium text-foreground">Change message</p>
                      <p className="mt-1 text-muted-foreground">{document.changeMessage}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {versionNumber === 1
                        ? "Initial upload."
                        : "No admin change message was provided."}
                    </p>
                  )}
                  {document.aiChangeSummary ? (
                    <div>
                      <p className="font-medium text-foreground">AI change summary</p>
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
                    <CardTitle>Extracted Text Preview</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {document.extractedText ? (
                    <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                      <p className="line-clamp-6 whitespace-pre-wrap">{document.extractedText}</p>
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
                            +{document.chunks.length - 2} more chunk
                            {document.chunks.length - 2 !== 1 ? "s" : ""}…
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {document.status === "processing"
                        ? "Text extraction is in progress."
                        : document.status === "failed"
                          ? "Text extraction failed for this document."
                          : "No extracted text available."}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>AI-extracted topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {documentTopics.length > 0
                      ? `${documentTopics.length} topics identified`
                      : "No topics extracted yet."}
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
                    <p className="text-xs text-muted-foreground">No topics extracted yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-medium text-foreground">v{versionNumber}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Latest</span>
                      <span className="font-medium text-foreground">
                        {isLatestVersion ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">File Name</span>
                      <span className="font-medium text-foreground truncate">
                        {document.fileName ?? document.title}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">File Type</span>
                      <span className="font-medium text-foreground uppercase">
                        {document.fileType}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">File Size</span>
                      <span className="font-medium text-foreground">{fileSizeLabel}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Topics</span>
                      <span className="font-medium text-foreground">{document.topics.length}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Chunks</span>
                      <span className="font-medium text-foreground">{document.chunks.length}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span className="font-medium text-foreground">
                        {formatDate(document.uploadedAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-foreground capitalize">
                        {document.status}
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
                            New versions can be uploaded from the latest uploaded document version.
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <DocumentLifecycleActions
                      document={document}
                      onLifecycleComplete={onLifecycleComplete}
                    />
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
                  <CardTitle>Full Extracted Text</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {document.extractedText ? (
                  <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                    {document.extractedText}
                  </div>
                ) : document.chunks.length > 0 ? (
                  <div className="space-y-6">
                    {document.chunks.map((chunk, index) => (
                      <div key={chunk.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Chunk {index + 1}
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
                      ? "Text extraction is in progress."
                      : document.status === "failed"
                        ? "Text extraction failed for this document."
                        : "No extracted text available."}
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
                <CardTitle>AI-extracted topics</CardTitle>
                <CardDescription>
                  Key learning topics extracted from this document after processing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentTopics.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {documentTopics.map((topicItem, i) => {
                      const confidenceLabel = formatConfidence(topicItem.confidence)
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
                                <Badge variant="outline">Confidence {confidenceLabel}</Badge>
                              ) : null}
                              {topicChunks.length > 0 ? (
                                <span>
                                  {topicChunks.length} chunk{topicChunks.length !== 1 ? "s" : ""}
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
              <CardTitle>Document Metadata</CardTitle>
              <CardDescription>Core metadata available from the document record.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Title</span>
                  <span className="text-sm text-foreground">{document.title}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">File Name</span>
                  <span className="text-sm text-foreground">
                    {document.fileName ?? document.title}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Extraction Method
                  </span>
                  <span className="text-sm text-foreground">
                    {document.extractionMethod ?? "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Processed</span>
                  <span className="text-sm text-foreground">
                    {document.processedAt ? formatDate(document.processedAt) : "—"}
                  </span>
                </div>
                {document.processingError ? (
                  <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Processing Error
                    </span>
                    <span className="text-sm text-destructive">{document.processingError}</span>
                  </div>
                ) : null}
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">File Type</span>
                  <span className="text-sm text-foreground uppercase">{document.fileType}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">File Size</span>
                  <span className="text-sm text-foreground">{fileSizeLabel}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <span className="text-sm text-foreground capitalize">{document.status}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-border pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Uploaded</span>
                  <span className="text-sm text-foreground">{formatDate(document.uploadedAt)}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <span className="text-sm text-foreground">v{versionNumber}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Version State</span>
                  <span className="text-sm text-foreground">
                    {isLatestVersion ? "Latest version" : "Old version"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                Immutable document versions and change history for this source.
              </CardDescription>
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
}: {
  status: DocumentStatus
  processingError?: string | null
}) {
  const steps: Array<{ key: DocumentStatus | "complete"; label: string }> = [
    { key: "uploaded", label: "Uploaded" },
    { key: "processing", label: "Processing" },
    { key: "complete", label: "Analysis Complete" },
    { key: "ready", label: "Ready" },
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
                {step.label}
              </div>
            </div>
          </div>
        )
      })}
      {status === "failed" && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <XCircle className="size-4 shrink-0" />
          {processingError ?? "Processing failed. Please re-upload the document."}
        </div>
      )}
    </div>
  )
}
