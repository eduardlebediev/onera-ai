"use client"

import { Sparkles } from "lucide-react"

import type { ResultAiFeedback } from "@/features/employee/tests/lib/test-result-model"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Card, CardContent } from "@/shared/ui/card"

interface TestAiFeedbackProps {
  feedback: ResultAiFeedback
}

export function TestAiFeedback({ feedback }: TestAiFeedbackProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="typography-h3 font-semibold">{t("employee.result.aiFeedback")}</h2>
            <span className="typography-small text-muted-foreground">
              {t("common.aiGenerated")}
            </span>
          </div>
        </div>

        <p className="typography-p">{feedback.performanceSummary}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">
              {t("employee.result.whatUnderstoodWell")}
            </p>
            <p className="typography-small">{feedback.understoodWell}</p>
          </div>
          <div className="space-y-1">
            <p className="typography-label text-muted-foreground">
              {t("employee.result.whatNeedsImprovement")}
            </p>
            <p className="typography-small">{feedback.needsImprovement}</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="typography-label text-primary">
              {t("employee.result.recommendedNextStep")}
            </p>
            <p className="mt-1 typography-small">{feedback.recommendedNextStep}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
