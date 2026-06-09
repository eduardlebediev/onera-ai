import Link from "next/link"
import { Sparkles, Upload } from "lucide-react"

import { Button } from "@/shared/ui/button"

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="typography-h1">Good Morning, Admin</h1>
        <p className="mt-1 typography-muted">
          Review documents, generate tests, and track employee knowledge across your team.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Button variant="outline" size="lg" disabled title="Not available in this demo">
          <Upload className="size-4" />
          Upload Document
        </Button>
        <Button variant="default" size="lg" asChild>
          <Link href="/admin/documents/doc-1/generate-test">
            <Sparkles className="size-4" />
            Generate Test
          </Link>
        </Button>
      </div>
    </div>
  )
}
