"use client"

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react"
import Link from "next/link"

import type { DocumentStatus, MockDocumentDetail } from "@/data/mock/documents"
import { canGenerateTest } from "@/features/documents/components/generate-test-model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

interface DocumentDetailProps {
  document: MockDocumentDetail
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

export function DocumentDetail({ document }: DocumentDetailProps) {
  const statusConfig = STATUS_CONFIG[document.status]
  const isReady = canGenerateTest(document)
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
          <Button variant="outline" disabled title="Download (coming soon)">
            <Download />
            Download
          </Button>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Edit Metadata (coming soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Share (coming soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="extracted-text">Extracted Text</TabsTrigger>
          <TabsTrigger value="topics">Topics ({document.topics.length})</TabsTrigger>
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
                    <ProcessingStatusTimeline status={document.status} />
                  </CardContent>
                </Card>
              </div>

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
                      <Button variant="outline" size="sm" className="mt-4" disabled>
                        View full text
                        <ExternalLink className="ml-1 size-3" />
                      </Button>
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
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>AI-Detected Topics</CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                    <Pencil className="mr-1 size-3" />
                    Edit topics
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {document.topics.length > 0
                      ? `${document.topics.length} topics identified`
                      : "No topics detected yet"}
                  </div>
                  {document.topics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {document.topics.map((topic, i) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className={TOPIC_BADGE_COLORS[i % TOPIC_BADGE_COLORS.length]}
                        >
                          <div className="mr-1.5 size-1.5 rounded-full bg-current opacity-60" />
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Topics will appear here once processing completes.
                    </p>
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
                      <span className="text-muted-foreground">File Name</span>
                      <span className="font-medium text-foreground truncate">{document.title}</span>
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
                    <Button
                      variant="outline"
                      disabled
                      className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Delete (coming soon)"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

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

        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>All Detected Topics</CardTitle>
              <CardDescription>
                These topics were automatically extracted from the document content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document.topics.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {document.topics.map((topic, i) => {
                    const topicChunks = document.chunks.filter((c) => c.topic === topic)
                    return (
                      <div
                        key={topic}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-2 rounded-full ${TOPIC_BADGE_COLORS[i % TOPIC_BADGE_COLORS.length].split(" ")[0].replace("bg-", "bg-").replace("-50", "-500")}`}
                          />
                          <span className="font-medium text-foreground">{topic}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {topicChunks.length > 0
                            ? `${topicChunks.length} chunk${topicChunks.length !== 1 ? "s" : ""}`
                            : "—"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No topics detected. Topics appear here after successful processing.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                  <span className="text-sm text-foreground">
                    v{document.versions[0]?.version ?? 1}
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
            </CardHeader>
            <CardContent>
              {document.versions.length > 0 ? (
                <div className="space-y-6">
                  {document.versions.map((version, index) => {
                    const isCurrent = index === 0
                    return (
                      <div key={version.id} className="relative pl-6">
                        {index < document.versions.length - 1 && (
                          <div className="absolute left-2 top-4 h-full w-px bg-border" />
                        )}
                        <div
                          className={`absolute left-0 top-1.5 size-4 rounded-full border-2 bg-background ${
                            isCurrent ? "border-primary" : "border-border"
                          }`}
                        />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            v{version.version}
                            {isCurrent && " (Current)"}
                          </span>
                          <span className="text-sm text-muted-foreground capitalize">
                            {formatDate(version.uploadedAt)} · {version.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No version history available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProcessingStatusTimeline({ status }: { status: DocumentStatus }) {
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
          Processing failed. Please re-upload the document.
        </div>
      )}
    </div>
  )
}
