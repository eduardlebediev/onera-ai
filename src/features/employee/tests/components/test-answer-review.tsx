import { CheckCircle2, XCircle } from "lucide-react"

import { getPassFailBadgeClass } from "@/features/employee/tests/lib/employee-test-model"
import type { AnswerReviewItem } from "@/features/employee/tests/lib/test-result-model"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface TestAnswerReviewProps {
  answerReview: AnswerReviewItem[]
}

export function TestAnswerReview({ answerReview }: TestAnswerReviewProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="typography-h3 font-semibold">Answer Review</h2>

        <ul className="space-y-4">
          {answerReview.map((item, index) => {
            const StatusIcon = item.isCorrect ? CheckCircle2 : XCircle

            return (
              <li
                key={item.questionId}
                className={cn(
                  "space-y-3 rounded-lg border p-4",
                  item.isCorrect
                    ? "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/20 dark:bg-emerald-900/10"
                    : "border-red-200/60 bg-red-50/30 dark:border-red-900/20 dark:bg-red-900/10"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">Q{index + 1}. </span>
                    {item.questionText}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 gap-1", getPassFailBadgeClass(item.isCorrect))}
                  >
                    <StatusIcon className="size-3" />
                    {item.isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="typography-label text-muted-foreground">Your answer</p>
                    <p className="typography-small">{item.employeeAnswer}</p>
                  </div>
                  {!item.isCorrect ? (
                    <div className="space-y-1">
                      <p className="typography-label text-muted-foreground">Correct answer</p>
                      <p className="typography-small font-medium text-emerald-700 dark:text-emerald-400">
                        {item.correctAnswer}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <p className="typography-label text-muted-foreground">Explanation</p>
                  <p className="typography-small">{item.explanation}</p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 typography-small text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">Topic: </span>
                    {item.topic}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Source: </span>
                    {item.sourceChunkReference}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
