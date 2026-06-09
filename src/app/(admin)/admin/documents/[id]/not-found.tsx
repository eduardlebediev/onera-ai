import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { Button } from "@/shared/ui/button"

export default function DocumentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <FileQuestion className="size-12 text-muted-foreground" />
      <h1 className="typography-h2">Document not found</h1>
      <p className="max-w-md typography-muted">
        This document ID does not match any document in the demo. Try opening Security Guidelines
        from the Documents page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/admin/documents">View Documents</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/documents/doc-1">Open Security Guidelines</Link>
        </Button>
      </div>
    </div>
  )
}
