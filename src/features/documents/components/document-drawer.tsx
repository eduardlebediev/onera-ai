"use client"

import { MockDocumentDetail } from "@/data/mock/documents"
import { DocumentDetail } from "@/features/documents/components/document-detail"
import { Drawer, DrawerContent } from "@/shared/ui/drawer"

interface DocumentDrawerProps {
  document: MockDocumentDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentDrawer({ document, open, onOpenChange }: DocumentDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        aria-describedby={undefined}
        className="h-[90vh] overflow-hidden bg-background"
      >
        {document && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <DocumentDetail document={document} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
