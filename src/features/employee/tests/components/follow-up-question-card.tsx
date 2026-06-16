"use client"

import { useState } from "react"
import { FileText, Loader2, Sparkles } from "lucide-react"

import {
  FollowUpAnswerFeedback,
  FollowUpQuestionMeta,
} from "@/features/employee/tests/components/follow-up-answer-feedback"
import { submitFollowUpAnswerForQuestion } from "@/features/employee/tests/lib/follow-up-question-api-client"
import type { PersistedFollowUpAnswer } from "@/features/employee/tests/lib/supabase-employee-follow-ups"
import type { FollowUpQuestion } from "@/features/employee/tests/types/follow-up"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"
import { cn } from "@/lib/utils"

interface FollowUpQuestionCardProps {
  followUp: FollowUpQuestion
  testId?: string
  sourceDocumentId: string
  initialSubmittedAnswer?: PersistedFollowUpAnswer
  onComplete: (topic: string, isCorrect: boolean) => void
  onBackToResults: () => void
  onSubmitted?: (answer: {
    selectedOptionId: string
    isCorrect: boolean
    correctOptionId: string
    explanationAfterAnswer: string
  }) => void
}

export function FollowUpQuestionCard({
  followUp,
  testId,
  sourceDocumentId,
  initialSubmittedAnswer,
  onComplete,
  onBackToResults,
  onSubmitted,
}: FollowUpQuestionCardProps) {
  const { t } = useTranslation()
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(
    initialSubmittedAnswer?.selectedOptionId
  )
  const [isSubmitted, setIsSubmitted] = useState(Boolean(initialSubmittedAnswer))
  const [isCorrect, setIsCorrect] = useState(initialSubmittedAnswer?.isCorrect ?? false)
  const [isChecking, setIsChecking] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resolvedFollowUp, setResolvedFollowUp] = useState<FollowUpQuestion>(followUp)

  async function handleSubmit() {
    if (!selectedOptionId || isChecking || isSubmitted) return

    if (!testId) {
      setIsChecking(true)
      window.setTimeout(() => {
        const correct = selectedOptionId === followUp.correctOptionId
        setIsCorrect(correct)
        setIsSubmitted(true)
        onComplete(followUp.topic, correct)
        onSubmitted?.({
          selectedOptionId,
          isCorrect: correct,
          correctOptionId: followUp.correctOptionId ?? selectedOptionId,
          explanationAfterAnswer: followUp.explanationAfterAnswer,
        })
        setIsChecking(false)
      }, 600)
      return
    }

    setIsChecking(true)
    setSubmitError(null)

    try {
      const result = await submitFollowUpAnswerForQuestion(testId, followUp.id, selectedOptionId)

      setResolvedFollowUp((current) => ({
        ...current,
        correctOptionId: result.correctOptionId,
        explanationAfterAnswer: result.explanationAfterAnswer,
      }))
      setIsCorrect(result.isCorrect)
      setIsSubmitted(true)
      onComplete(followUp.topic, result.isCorrect)
      onSubmitted?.({
        selectedOptionId,
        isCorrect: result.isCorrect,
        correctOptionId: result.correctOptionId,
        explanationAfterAnswer: result.explanationAfterAnswer,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("employee.followUp.submitFailed"))
    } finally {
      setIsChecking(false)
    }
  }

  function handleTryAnother() {
    if (testId) {
      return
    }

    setSelectedOptionId(undefined)
    setIsSubmitted(false)
    setIsCorrect(false)
    setSubmitError(null)
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold">{t("employee.result.checkUnderstanding")}</p>
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 bg-background/80 p-4">
        <p className="typography-label text-muted-foreground">
          {t("employee.followUp.whatYouMissed")}
        </p>
        <p className="typography-small">{resolvedFollowUp.explanationBeforeQuestion}</p>
      </div>

      {isSubmitted ? (
        <FollowUpAnswerFeedback
          followUp={resolvedFollowUp}
          isCorrect={isCorrect}
          sourceDocumentId={sourceDocumentId}
          testId={testId}
          onTryAnother={handleTryAnother}
          onBackToResults={onBackToResults}
          showTryAgain={!testId}
        />
      ) : (
        <>
          <FollowUpQuestionMeta followUp={resolvedFollowUp} />

          <div className="space-y-2">
            <p className="text-sm font-medium">{resolvedFollowUp.questionText}</p>
            <p className="flex items-start gap-1.5 typography-small text-muted-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {t("employee.takeTest.progress.sourceReference", {
                  reference: resolvedFollowUp.sourceChunkReference,
                })}
              </span>
            </p>
          </div>

          <div
            className="space-y-2"
            role="radiogroup"
            aria-label={t("employee.result.checkUnderstanding")}
          >
            {resolvedFollowUp.options.map((option) => {
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

          {submitError ? <p className="typography-small text-destructive">{submitError}</p> : null}

          <Button
            type="button"
            size="sm"
            disabled={!selectedOptionId || isChecking}
            onClick={() => void handleSubmit()}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("employee.followUp.checking")}
              </>
            ) : (
              t("employee.followUp.submitAnswer")
            )}
          </Button>
        </>
      )}
    </div>
  )
}
