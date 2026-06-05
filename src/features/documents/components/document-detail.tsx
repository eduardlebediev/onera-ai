import Link from "next/link"
import { ArrowLeft, CalendarDays, Tag, AlignLeft, FlaskConical, Wand2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Typography } from "@/shared/ui/typography"
import { type DocumentStatus, type MockDocumentDetail } from "@/data/mock/documents"

const STATUS_LABELS: Record<DocumentStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
  uploaded: "Uploaded",
}

const STATUS_VARIANTS: Record<DocumentStatus, "default" | "secondary" | "destructive" | "outline"> =
  {
    ready: "default",
    processing: "outline",
    failed: "destructive",
    uploaded: "secondary",
  }

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

interface DocumentDetailProps {
  document: MockDocumentDetail
}

export function DocumentDetail({ document }: DocumentDetailProps) {
  const statusLabel = STATUS_LABELS[document.status]
  const statusVariant = STATUS_VARIANTS[document.status]

  return (
    <div className="page-shell mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/documents"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-4")}
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Documents
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Typography variant="h2">{document.title}</Typography>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <Typography variant="muted">{document.description}</Typography>
          </div>
          <Button className="shrink-0 rounded-full" disabled title="Coming soon">
            <Wand2 className="mr-2 size-4" />
            Generate Test
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            Uploaded {formatDate(document.uploadedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Tag className="size-4" />
            {document.topicsCount} {document.topicsCount === 1 ? "topic" : "topics"}
          </span>
          <span className="flex items-center gap-1.5">
            <FlaskConical className="size-4" />
            {document.linkedTests.length} linked{" "}
            {document.linkedTests.length === 1 ? "test" : "tests"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5">
                <Tag className="size-4 text-muted-foreground" />
                <Typography variant="h3">Detected Topics</Typography>
              </div>
            </CardHeader>
            <CardContent>
              {document.topics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {document.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No topics detected yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5">
                <AlignLeft className="size-4 text-muted-foreground" />
                <Typography variant="h3">Document Chunks</Typography>
              </div>
            </CardHeader>
            <CardContent>
              {document.chunks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {document.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary">{chunk.topic}</span>
                        <span className="text-xs text-muted-foreground">
                          Chunk {chunk.chunkIndex + 1}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background p-6 text-center">
                  {document.status === "processing" ? (
                    <p className="text-sm text-muted-foreground">
                      Document is still being processed. Check back shortly.
                    </p>
                  ) : document.status === "failed" ? (
                    <p className="text-sm text-destructive">
                      Processing failed. No chunks were extracted.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No chunks available.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="size-4 text-muted-foreground" />
                <Typography variant="h3">Linked Tests</Typography>
              </div>
            </CardHeader>
            <CardContent>
              {document.linkedTests.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {document.linkedTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex flex-col gap-1 rounded-xl border border-border bg-background p-3"
                    >
                      <span className="text-sm font-medium text-foreground">{test.title}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {test.questionCount} questions
                        </span>
                        <Badge
                          variant={test.status === "published" ? "default" : "outline"}
                          className="text-xs"
                        >
                          {test.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tests linked yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <Wand2 className="size-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-foreground">Generate Test</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  AI-powered test generation from this document is coming soon.
                </p>
              </div>
              <Button className="w-full rounded-full" disabled>
                Generate Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
