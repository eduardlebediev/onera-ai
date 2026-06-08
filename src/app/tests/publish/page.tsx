import { ArrowLeft, Rocket } from "lucide-react"
import Link from "next/link"

import { mockDocuments } from "@/data/mock/documents"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface PublishTestPageProps {
  searchParams: Promise<{ documentId?: string }>
}

export default async function PublishTestPlaceholderPage({ searchParams }: PublishTestPageProps) {
  const { documentId } = await searchParams
  const sourceDocument = mockDocuments.find((d) => d.id === documentId)

  return (
    <div className="page-shell-narrow">
      {documentId && (
        <Button asChild variant="outline" className="mb-6 h-9">
          <Link href={`/tests/review?documentId=${encodeURIComponent(documentId)}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Review
          </Link>
        </Button>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-background">
              <Rocket className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Publish Test</CardTitle>
              {sourceDocument && (
                <p className="text-sm text-muted-foreground mt-0.5">{sourceDocument.title}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="typography-p text-muted-foreground">
            Publish Test Flow will be implemented next.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
