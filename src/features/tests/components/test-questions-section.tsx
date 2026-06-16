import { CheckCircle2 } from "lucide-react"

import type { TestQuestion } from "@/features/tests/types/test"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestQuestionsSectionProps {
  questions: TestQuestion[]
}

export function TestQuestionsSection({ questions }: TestQuestionsSectionProps) {
  return (
    <div className="space-y-2">
      <h2 className="typography-h3 font-semibold">Questions ({questions.length})</h2>
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No questions in this test yet.</p>
          </CardContent>
        </Card>
      ) : (
        questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold leading-snug">
                {index + 1}. {question.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {question.options.map((option) => {
                  const isCorrect = option === question.correctAnswer
                  return (
                    <li
                      key={option}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                        isCorrect
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                      {option}
                    </li>
                  )
                })}
              </ul>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="font-normal">
                  {question.topic}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {question.testedSkill}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {question.pedagogicalGoal}
                </Badge>
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {question.sourceChunkReference}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
