import { BookOpen } from "lucide-react"

import type { ResultWeakTopic } from "@/features/employee/tests/lib/test-result-model"
import { Card, CardContent } from "@/shared/ui/card"

interface TestWeakTopicsProps {
  weakTopics: ResultWeakTopic[]
}

export function TestWeakTopics({ weakTopics }: TestWeakTopicsProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h2 className="typography-h3 font-semibold">Weak Topics</h2>
        </div>

        {weakTopics.length === 0 ? (
          <p className="typography-small text-muted-foreground">
            No weak topics identified. Great work on this attempt.
          </p>
        ) : (
          <ul className="space-y-3">
            {weakTopics.map((topic) => (
              <li
                key={topic.topic}
                className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{topic.topic}</p>
                  <span className="shrink-0 typography-small text-muted-foreground">
                    {topic.missedQuestionsCount} missed
                  </span>
                </div>
                <p className="typography-small text-muted-foreground">{topic.explanation}</p>
                <p className="typography-small">
                  <span className="font-medium text-foreground">Review: </span>
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
