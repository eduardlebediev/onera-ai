"use client"

import { Check } from "lucide-react"

import type { DocumentDetail } from "@/features/documents/types/document"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { getGenerateTestTopics, getTopicSummary } from "./generate-test-model"

interface DocumentTopicSelectionGroupProps {
  document: DocumentDetail
  selectedTopicIds: string[]
  selectedChunkIds: string[]
  onToggleTopic: (documentId: string, topicKey: string, chunkIds: string[]) => void
  onToggleChunk: (documentId: string, chunkId: string, topicKey?: string) => void
  onSelectAllChunks: (documentId: string) => void
  onClearAllChunks: (documentId: string) => void
}

function getTopicKey(document: DocumentDetail, topic: { id?: string; topic: string }): string {
  return topic.id ?? `${document.id}:${topic.topic}`
}

function getDocumentTopics(document: DocumentDetail): Array<{ id?: string; topic: string }> {
  if (document.documentTopics && document.documentTopics.length > 0) {
    return document.documentTopics
  }

  return getGenerateTestTopics(document).map((topic) => ({ topic }))
}

export function DocumentTopicSelectionGroup({
  document,
  selectedTopicIds,
  selectedChunkIds,
  onToggleTopic,
  onToggleChunk,
  onSelectAllChunks,
  onClearAllChunks,
}: DocumentTopicSelectionGroupProps) {
  const topics = getDocumentTopics(document)
  const documentChunkIds = document.chunks.map((chunk) => chunk.id)
  const selectedDocumentChunkIds = selectedChunkIds.filter((chunkId) =>
    documentChunkIds.includes(chunkId)
  )
  const areAllSelected =
    document.chunks.length > 0 && selectedDocumentChunkIds.length === document.chunks.length

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-5">
        <div>
          <CardTitle className="text-base font-semibold">{document.title}</CardTitle>
          <p className="mt-1 typography-small text-muted-foreground">
            Select topics and chunks from this document.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="typography-small text-muted-foreground">
            {selectedDocumentChunkIds.length} selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-3"
            onClick={() =>
              areAllSelected ? onClearAllChunks(document.id) : onSelectAllChunks(document.id)
            }
          >
            {areAllSelected ? "Clear All" : "Select All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {topics.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {topics.map((topic) => {
              const topicKey = getTopicKey(document, topic)
              const topicChunkIds = document.chunks
                .filter((chunk) => chunk.topic === topic.topic)
                .map((chunk) => chunk.id)
              const isSelected = selectedTopicIds.includes(topicKey)

              return (
                <button
                  key={topicKey}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleTopic(document.id, topicKey, topicChunkIds)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    isSelected
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isSelected ? (
                      <div className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="mt-0.5 size-4 rounded-full border border-border/70 bg-background" />
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                      <p className="typography-small line-clamp-2 text-muted-foreground">
                        {getTopicSummary(document, topic.topic)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            No detected topics are available for this document yet.
          </div>
        )}

        {document.chunks.length > 0 ? (
          <div className="grid gap-px overflow-hidden rounded-xl border border-border/50 md:grid-cols-2">
            {document.chunks.map((chunk) => {
              const isSelected = selectedChunkIds.includes(chunk.id)

              return (
                <button
                  key={chunk.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleChunk(document.id, chunk.id, chunk.topic)}
                  className="flex items-start gap-4 border-b border-border/50 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:border-b-0"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px]",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/80 bg-background"
                    )}
                  >
                    {isSelected && <Check className="size-3" strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Chunk {chunk.chunkIndex + 1}
                      </span>
                      <Badge variant="secondary" className="font-normal">
                        {chunk.topic}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{chunk.content}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No extracted chunks are available for this document yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
