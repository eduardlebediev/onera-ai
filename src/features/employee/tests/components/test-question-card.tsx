import { BookOpen, FileText } from "lucide-react"

import type { EmployeeSafeQuestion } from "@/features/employee/tests/lib/supabase-employee-tests"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface SupabaseTestQuestionCardProps {
  question: EmployeeSafeQuestion
  questionNumber: number
  totalQuestions: number
  selectedOptionIds: string[]
  openText?: string
  onSelectOptionIds: (optionIds: string[]) => void
  onOpenTextChange?: (text: string) => void
}

function formatSupabaseQuestionType(questionType: EmployeeSafeQuestion["questionType"]): string {
  switch (questionType) {
    case "single_choice":
      return "Single choice"
    case "multiple_choice":
      return "Multiple choice"
    case "true_false":
      return "True / false"
    case "open_question":
      return "Open question"
  }
}

export function TestQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionIds,
  openText = "",
  onSelectOptionIds,
  onOpenTextChange,
}: SupabaseTestQuestionCardProps) {
  const isMultiple = question.questionType === "multiple_choice"
  const isOpenQuestion = question.questionType === "open_question"
  const groupRole = isMultiple ? "group" : "radiogroup"

  function handleOptionClick(optionId: string) {
    if (isMultiple) {
      const next = selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter((id) => id !== optionId)
        : [...selectedOptionIds, optionId]
      onSelectOptionIds(next)
      return
    }

    onSelectOptionIds([optionId])
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-medium">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant="outline" className="text-[11px] font-medium">
              {formatSupabaseQuestionType(question.questionType)}
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

        {isOpenQuestion ? (
          <textarea
            value={openText}
            onChange={(event) => onOpenTextChange?.(event.target.value)}
            rows={5}
            aria-label={`Open answer for question ${questionNumber}`}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y min-h-32"
            placeholder="Type your answer here..."
          />
        ) : (
          <div
            className="space-y-2"
            role={groupRole}
            aria-label={`Answer options for question ${questionNumber}`}
          >
            {question.options.map((option) => {
              const isSelected = selectedOptionIds.includes(option.id)

              return (
                <button
                  key={option.id}
                  type="button"
                  role={isMultiple ? "checkbox" : "radio"}
                  aria-checked={isSelected}
                  onClick={() => handleOptionClick(option.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center border",
                      isMultiple ? "rounded-md" : "rounded-full",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40 bg-background"
                    )}
                    aria-hidden="true"
                  >
                    {isSelected ? (
                      isMultiple ? (
                        <span className="size-2 rounded-sm bg-background" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-background" />
                      )
                    ) : null}
                  </span>
                  <span className="typography-small text-foreground">{option.text}</span>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
