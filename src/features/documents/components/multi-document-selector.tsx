"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"

import type { DocumentDetail } from "@/features/documents/types/document"
import { MAX_SELECTABLE_DOCUMENTS } from "@/features/documents/components/generate-test-model"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface MultiDocumentSelectorProps {
  selectableDocuments: DocumentDetail[]
  selectedDocumentIds: string[]
  lockedDocumentId?: string
  onToggleDocument: (documentId: string) => void
}

export function MultiDocumentSelector({
  selectableDocuments,
  selectedDocumentIds,
  lockedDocumentId,
  onToggleDocument,
}: MultiDocumentSelectorProps) {
  const atMaxSelection =
    selectedDocumentIds.length >= MAX_SELECTABLE_DOCUMENTS && selectedDocumentIds.length > 0

  const sortedDocuments = useMemo(() => {
    return [...selectableDocuments].sort((a, b) => {
      const aSelected = selectedDocumentIds.includes(a.id)
      const bSelected = selectedDocumentIds.includes(b.id)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return 0
    })
  }, [selectableDocuments, selectedDocumentIds])

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border/50 px-6 py-4">
        <CardTitle className="text-base font-semibold">Source Documents</CardTitle>
        <p className="mt-1 typography-small text-muted-foreground">
          Select up to {MAX_SELECTABLE_DOCUMENTS} ready documents for this test.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[280px] overflow-y-auto p-4 space-y-2">
          {sortedDocuments.length > 0 ? (
            sortedDocuments.map((document) => {
              const isSelected = selectedDocumentIds.includes(document.id)
              const isLocked = document.id === lockedDocumentId
              const isDisabled = !isSelected && atMaxSelection

              return (
                <button
                  key={document.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isDisabled || isLocked}
                  onClick={() => onToggleDocument(document.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isSelected
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-background hover:bg-muted/40",
                    isDisabled && "cursor-not-allowed opacity-50",
                    isLocked && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background"
                    )}
                  >
                    {isSelected && <Check className="size-3" strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {document.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {isLocked ? (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                            Required
                          </Badge>
                        ) : null}
                        {document.versionNumber ? (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                            v{document.versionNumber}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {document.topics.length} topics · {document.chunks.length} chunks
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
              No selectable ready documents are available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
