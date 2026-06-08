import { BookOpen, FileText } from "lucide-react"

import { formatTestQuestionType } from "@/features/employee/tests/lib/test-taking-state"
import type { TestQuestion } from "@/features/tests/mock/tests"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface TestQuestionCardProps {
  question: TestQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | undefined
  onSelectAnswer: (answer: string) => void
}

export function TestQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
}: TestQuestionCardProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-medium">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium">
              {formatTestQuestionType(question.type)}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium">
              <BookOpen className="mr-1 size-3" />
              {question.topic}
            </Badge>
          </div>

          <h2 className="typography-h3 font-semibold text-foreground">{question.questionText}</h2>

          {question.sourceChunkReference ? (
            <p className="flex items-start gap-1.5 typography-small text-muted-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0" />
              <span>Source: {question.sourceChunkReference}</span>
            </p>
          ) : null}
        </div>

        {/* MVP: all question types use single-select (true_false and single_choice). */}
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label={`Answer options for question ${questionNumber}`}
        >
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option

            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectAnswer(option)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/30"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40 bg-background"
                  )}
                  aria-hidden="true"
                >
                  {isSelected ? <span className="size-1.5 rounded-full bg-background" /> : null}
                </span>
                <span className="typography-small text-foreground">{option}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
