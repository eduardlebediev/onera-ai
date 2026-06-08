"use client"

import { useState } from "react"
import { FileText, Sparkles } from "lucide-react"

import {
  FollowUpAnswerFeedback,
  FollowUpQuestionMeta,
} from "@/features/employee/tests/components/follow-up-answer-feedback"
import type { FollowUpQuestion } from "@/features/employee/tests/mock/follow-up-questions"
import { Button } from "@/shared/ui/button"
import { cn } from "@/lib/utils"

interface FollowUpQuestionCardProps {
  followUp: FollowUpQuestion
  sourceDocumentId: string
  onComplete: (topic: string, isCorrect: boolean) => void
  onBackToResults: () => void
}

export function FollowUpQuestionCard({
  followUp,
  sourceDocumentId,
  onComplete,
  onBackToResults,
}: FollowUpQuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  function handleSubmit() {
    if (!selectedOptionId) return

    const correct = selectedOptionId === followUp.correctOptionId
    setIsCorrect(correct)
    setIsSubmitted(true)
    onComplete(followUp.topic, correct)
  }

  function handleTryAnother() {
    setSelectedOptionId(undefined)
    setIsSubmitted(false)
    setIsCorrect(false)
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold">Check understanding</p>
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 bg-background/80 p-4">
        <p className="typography-label text-muted-foreground">What you missed</p>
        <p className="typography-small">{followUp.explanationBeforeQuestion}</p>
      </div>

      {isSubmitted ? (
        <FollowUpAnswerFeedback
          followUp={followUp}
          isCorrect={isCorrect}
          sourceDocumentId={sourceDocumentId}
          onTryAnother={handleTryAnother}
          onBackToResults={onBackToResults}
        />
      ) : (
        <>
          <FollowUpQuestionMeta followUp={followUp} />

          <div className="space-y-2">
            <p className="text-sm font-medium">{followUp.questionText}</p>
            <p className="flex items-start gap-1.5 typography-small text-muted-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0" />
              <span>Source: {followUp.sourceChunkReference}</span>
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Follow-up answer options">
            {followUp.options.map((option) => {
              const isSelected = selectedOptionId === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedOptionId(option.id)}
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
                  <span className="typography-small text-foreground">{option.label}</span>
                </button>
              )
            })}
          </div>

          <Button type="button" size="sm" disabled={!selectedOptionId} onClick={handleSubmit}>
            Submit answer
          </Button>
        </>
      )}
    </div>
  )
}
