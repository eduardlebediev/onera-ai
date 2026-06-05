"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ExternalLink, FileText, Tag, AlignLeft, FlaskConical } from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer"
import { type MockDocumentDetail, type DocumentStatus } from "@/data/mock/documents"

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

interface DocumentDrawerProps {
  document: MockDocumentDetail
  trigger?: ReactNode
}

export function DocumentDrawer({ document, trigger }: DocumentDrawerProps) {
  const statusLabel = STATUS_LABELS[document.status]
  const statusVariant = STATUS_VARIANTS[document.status]
  const previewChunks = document.chunks.slice(0, 2)

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Quick Preview
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="flex flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DrawerHeader className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <DrawerTitle className="text-base font-semibold leading-snug">
                {document.title}
              </DrawerTitle>
            </div>
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
          <DrawerDescription className="mt-2 text-sm text-muted-foreground">
            {document.description}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-6 px-6 py-5">
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <Tag className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Detected Topics
              </span>
            </div>
            {document.topics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {document.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No topics detected yet.</p>
            )}
          </section>

          {previewChunks.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5">
                <AlignLeft className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Content Preview
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {previewChunks.map((chunk) => (
                  <div key={chunk.id} className="rounded-xl border border-border bg-card p-3">
                    <span className="mb-1 block text-xs font-medium text-primary">
                      {chunk.topic}
                    </span>
                    <p className="line-clamp-3 text-sm text-foreground">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {document.status === "processing" && previewChunks.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Content is still being processed. Check back shortly.
              </p>
            </div>
          )}

          {document.status === "failed" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">
                Processing failed. Please re-upload the document.
              </p>
            </div>
          )}

          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <FlaskConical className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Linked Tests
              </span>
            </div>
            {document.linkedTests.length > 0 ? (
              <div className="flex flex-col gap-2">
                {document.linkedTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium text-foreground">{test.title}</span>
                    <div className="flex items-center gap-2">
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
          </section>
        </div>

        <DrawerFooter className="border-t border-border px-6 py-4">
          <Button render={<Link href={`/documents/${document.id}`} />} className="w-full">
            <ExternalLink className="mr-2 size-4" />
            Open Full Page
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
