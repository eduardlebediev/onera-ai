"use client"

import { MockDocumentDetail } from "@/data/mock/documents"
import { DocumentDetail } from "@/features/documents/components/document-detail"
import type { DocumentLifecycleCompleteHandler } from "@/features/documents/components/document-lifecycle-actions"
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"

interface DocumentDrawerProps {
  document: MockDocumentDetail | null
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
      >
        <DrawerTitle className="sr-only">{document?.title ?? "Document Preview"}</DrawerTitle>
        {document && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <DocumentDetail document={document} onLifecycleComplete={onLifecycleComplete} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
