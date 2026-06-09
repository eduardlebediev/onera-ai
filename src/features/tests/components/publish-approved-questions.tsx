import type { ReviewQuestion } from "@/features/tests/mock/generated-test-review"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface PublishApprovedQuestionsProps {
  questions: ReviewQuestion[]
  rejectedCount: number
}

export function PublishApprovedQuestions({
  questions,
  rejectedCount,
}: PublishApprovedQuestionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Questions ({questions.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved questions yet. Return to review and approve at least one question before
            publishing.
          </p>
        ) : (
          <ul className="space-y-3">
            {questions.map((question, index) => (
              <li
                key={question.id}
                className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-4"
              >
                <p className="text-sm font-medium leading-snug text-foreground">
                  {index + 1}. {question.questionText}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="font-normal">
                    {question.topic}
                  </Badge>
                  <Badge variant="outline" className="font-normal capitalize">
                    {question.difficulty}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 typography-small text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">Tested skill: </span>
                    {question.testedSkill}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Goal: </span>
                    {question.pedagogicalGoal}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Source: </span>
                    {question.sourceChunkReference}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rejectedCount > 0 ? (
          <p className="typography-small text-muted-foreground">
            Rejected questions will not be included in the published test.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
