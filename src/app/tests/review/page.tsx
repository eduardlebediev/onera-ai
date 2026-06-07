import { ClipboardCheck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export default function TestReviewPlaceholderPage() {
  return (
    <div className="page-shell max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-background">
              <ClipboardCheck className="size-4 text-muted-foreground" />
            </div>
            <CardTitle>Test Review</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="typography-p text-muted-foreground">
            Test Review Flow will be implemented next.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
