import Link from "next/link"
import { Sparkles } from "lucide-react"

import { DocumentUploadButton } from "@/features/documents/components/document-upload-button"
import { Button } from "@/shared/ui/button"

interface DashboardHeaderProps {
  adminName: string
  generateTestHref: string
}

export function DashboardHeader({ adminName, generateTestHref }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="typography-label text-muted-foreground">Welcome back</p>
        <h1 className="typography-h1">{adminName}</h1>
        <p className="mt-1 typography-p text-muted-foreground">
          Review documents, generate tests, and track employee knowledge across your team.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <DocumentUploadButton
          className="shrink-0"
          iconClassName="size-4"
          showInlineError={false}
          size="lg"
          variant="outline"
        />
        <Button variant="default" size="lg" asChild>
          <Link href={generateTestHref}>
            <Sparkles className="size-4" />
            Generate Test
          </Link>
        </Button>
      </div>
    </div>
  )
}
