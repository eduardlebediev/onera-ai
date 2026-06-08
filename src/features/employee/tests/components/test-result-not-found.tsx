import Link from "next/link"
import { ArrowLeft, Target } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export function TestResultNotFound() {
  return (
    <div className="page-shell">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card">
          <Target className="size-4.5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="typography-h1">Result not found</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            This test result is not available or the test does not exist.
          </p>
        </div>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="typography-p text-muted-foreground">
            Return to My Tests to view your assigned assessments.
          </p>
          <Button asChild variant="outline">
            <Link href="/employee/tests">
              <ArrowLeft className="size-4" />
              Back to My Tests
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
