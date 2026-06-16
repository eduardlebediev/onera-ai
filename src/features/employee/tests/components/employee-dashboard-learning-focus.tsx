import { BookOpen } from "lucide-react"

import type { DashboardWeakTopic } from "@/features/employee/tests/lib/employee-dashboard-model"
import type { createTranslator } from "@/shared/i18n/translate"
import { Card, CardContent } from "@/shared/ui/card"

type Translate = ReturnType<typeof createTranslator>["t"]

interface EmployeeDashboardLearningFocusProps {
  weakTopics: DashboardWeakTopic[]
  t: Translate
}

export function EmployeeDashboardLearningFocus({
  weakTopics,
  t,
}: EmployeeDashboardLearningFocusProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="typography-h3 font-semibold">{t("employee.dashboard.learningFocus")}</h2>
        </div>

        {weakTopics.length === 0 ? (
          <p className="typography-small text-muted-foreground">
            {t("employee.dashboard.noWeakTopics")}
          </p>
        ) : (
          <ul className="space-y-3">
            {weakTopics.map((topic) => (
              <li
                key={topic.topic}
                className="space-y-1 rounded-lg border border-border/60 bg-background/50 p-4"
              >
                <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                <p className="typography-small line-clamp-1 text-muted-foreground">
                  {topic.explanation}
                </p>
                <p className="typography-small">
                  <span className="font-medium text-foreground">
                    {t("employee.dashboard.recommended")}{" "}
                  </span>
                  {topic.recommendedAction}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
