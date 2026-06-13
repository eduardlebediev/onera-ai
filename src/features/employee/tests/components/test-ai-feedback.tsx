import { Sparkles } from "lucide-react"

import type { ResultAiFeedback } from "@/features/employee/tests/lib/test-result-model"
import { Card, CardContent } from "@/shared/ui/card"

interface TestAiFeedbackProps {
  feedback: ResultAiFeedback
}

export function TestAiFeedback({ feedback }: TestAiFeedbackProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="typography-h3 font-semibold">AI Feedback</h2>
            <span className="typography-small text-muted-foreground">AI-generated</span>
          </div>
        </div>

        <p className="typography-p">{feedback.performanceSummary}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">What you understood well</p>
            <p className="typography-small">{feedback.understoodWell}</p>
          </div>
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">What needs improvement</p>
            <p className="typography-small">{feedback.needsImprovement}</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="typography-label text-primary">Recommended next step</p>
            <p className="mt-1 typography-small">{feedback.recommendedNextStep}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
