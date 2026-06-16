"use client"

import type { DocumentDetail as DocumentDetailData } from "@/features/documents/types/document"
import { DocumentDetail } from "@/features/documents/components/document-detail"
import type { DocumentLifecycleCompleteHandler } from "@/features/documents/components/document-lifecycle-actions"
import { Maximize2, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/shared/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"

interface DocumentDrawerProps {
  document: DocumentDetailData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLifecycleComplete?: DocumentLifecycleCompleteHandler
}

export function DocumentDrawer({
  document,
  open,
  onOpenChange,
  onLifecycleComplete,
}: DocumentDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        aria-describedby={undefined}
        className="h-[90vh] overflow-hidden bg-background"
        leftAction={
          document ? (
            <Button asChild variant="ghost" size="icon">
              <Link href={`/admin/documents/${document.id}`} aria-label="Open full page">
                <Maximize2 className="size-4" />
              </Link>
            </Button>
          ) : null
        }
        rightAction={
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        }
      >
        <DrawerTitle className="sr-only">{document?.title ?? "Document Preview"}</DrawerTitle>
        {document && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <DocumentDetail
              document={document}
              onLifecycleComplete={onLifecycleComplete}
              showBreadcrumbs={false}
            />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
