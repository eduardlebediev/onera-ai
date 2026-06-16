"use client"

import { BookOpen } from "lucide-react"

import type { FollowUpTopicStatus } from "@/features/employee/tests/types/follow-up"
import type { ResultWeakTopic } from "@/features/employee/tests/lib/test-result-model"
import { useTranslation } from "@/shared/i18n/use-translation"
import type { TranslationKey } from "@/shared/i18n/translate"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface TestWeakTopicsProps {
  weakTopics: ResultWeakTopic[]
  followUpStatusByTopic?: Record<string, FollowUpTopicStatus>
}

const FOLLOW_UP_STATUS_LABEL_KEYS: Record<FollowUpTopicStatus, TranslationKey> = {
  needs_review: "employee.result.needsReview",
  follow_up_completed: "employee.result.followUpCompleted",
  topic_understood: "employee.result.topicUnderstood",
}

function getFollowUpStatusBadgeClass(status: FollowUpTopicStatus): string {
  switch (status) {
    case "topic_understood":
      return "border-emerald-200/60 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/20 dark:bg-emerald-900/10 dark:text-emerald-400"
    case "follow_up_completed":
      return "border-amber-200/60 bg-amber-50/50 text-amber-800 dark:border-amber-900/20 dark:bg-amber-900/10 dark:text-amber-400"
    case "needs_review":
      return "border-border/60 bg-muted/30 text-muted-foreground"
  }
}

export function TestWeakTopics({ weakTopics, followUpStatusByTopic = {} }: TestWeakTopicsProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="typography-h3 font-semibold">{t("employee.result.weakTopicsCard")}</h2>
        </div>

        {weakTopics.length === 0 ? (
          <p className="typography-small text-muted-foreground">
            {t("employee.result.weakTopicsGreatWork")}
          </p>
        ) : (
          <ul className="space-y-3">
            {weakTopics.map((topic) => {
              const followUpStatus = followUpStatusByTopic[topic.topic] ?? "needs_review"

              return (
                <li
                  key={topic.topic}
                  className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{topic.topic}</p>
                    <span className="shrink-0 typography-small text-muted-foreground">
                      {t("employee.result.missedCount", { count: topic.missedQuestionsCount })}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] font-medium",
                      getFollowUpStatusBadgeClass(followUpStatus)
                    )}
                  >
                    {t(FOLLOW_UP_STATUS_LABEL_KEYS[followUpStatus])}
                  </Badge>

                  <p className="typography-small text-muted-foreground">{topic.explanation}</p>
                  <p className="typography-small">
                    <span className="font-medium text-foreground">
                      {t("employee.result.reviewLabel")}:{" "}
                    </span>
                    {topic.recommendedAction}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
