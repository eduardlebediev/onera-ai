"use client"

import { Check } from "lucide-react"

import { type DocumentChunk } from "@/features/documents/types/document"
import { cn } from "@/lib/utils"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface ChunkSelectorProps {
  chunks: DocumentChunk[]
  selectedChunkIds: string[]
  onToggleChunk: (chunkId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function ChunkSelector({
  chunks,
  selectedChunkIds,
  onToggleChunk,
  onSelectAll,
  onClearAll,
}: ChunkSelectorProps) {
  const areAllSelected = chunks.length > 0 && selectedChunkIds.length === chunks.length

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-5">
        <CardTitle className="text-base font-semibold">Selected Chunks</CardTitle>
        <div className="flex items-center gap-4">
          <span className="typography-small text-muted-foreground">
            {selectedChunkIds.length} selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-3 text-foreground"
            onClick={areAllSelected ? onClearAll : onSelectAll}
          >
            {areAllSelected ? "Clear All" : "Select All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {chunks.length > 0 ? (
          <div className="grid md:grid-cols-2 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-border/50 [&>*:not(:last-child):not(:nth-last-child(2))]:border-b [&>*:not(:last-child)]:border-border/50">
            {chunks.map((chunk) => {
              const isSelected = selectedChunkIds.includes(chunk.id)

              return (
                <button
                  key={chunk.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleChunk(chunk.id)}
                  className="flex items-start gap-4 p-6 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 border-b border-border/50 md:border-b-0"
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
                      <span className="text-sm text-muted-foreground whitespace-nowrap mt-0.5">
                        {chunk.topic}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{chunk.content}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            No extracted chunks are available for this document yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
