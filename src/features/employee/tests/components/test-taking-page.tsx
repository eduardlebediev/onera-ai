"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { TestProgressPanel } from "@/features/employee/tests/components/test-progress-panel"
import { TestQuestionCard } from "@/features/employee/tests/components/test-question-card"
import {
  startEmployeeTestAttempt,
  submitEmployeeTestAttempt,
} from "@/features/employee/tests/lib/employee-attempt-api-client"
import {
  getSupabaseTestTakingProgress,
  getTestTakingProgress,
  isQuestionAnswered,
  isSupabaseQuestionAnswered,
  isSupabaseTakeableTest,
  type EmployeeTakeableTest,
  type SupabaseTestTakingAnswers,
  type TestTakingAnswers,
} from "@/features/employee/tests/lib/test-taking-state"
import { saveTakeSession } from "@/features/employee/tests/lib/take-session"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface TestTakingPageProps {
  test: EmployeeTakeableTest
}

const MIN_START_ATTEMPT_LOADING_MS = 350

export function TestTakingPage({ test }: TestTakingPageProps) {
  const router = useRouter()
  const startedAtRef = useRef(Date.now())
  const isSupabase = isSupabaseTakeableTest(test)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [mockAnswers, setMockAnswers] = useState<TestTakingAnswers>({})
  const [supabaseAnswers, setSupabaseAnswers] = useState<SupabaseTestTakingAnswers>({})
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [isStartingAttempt, setIsStartingAttempt] = useState(isSupabase)
  const [startAttemptError, setStartAttemptError] = useState<string | null>(null)
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabase) return

    let cancelled = false

    async function ensureAttemptStarted() {
      const loadingStartedAt = Date.now()
      setIsStartingAttempt(true)
      setStartAttemptError(null)

      try {
        const result = await startEmployeeTestAttempt(test.id)
        if (!cancelled) {
          setAttemptId(result.attemptId)
        }
      } catch (error) {
        if (!cancelled) {
          setStartAttemptError(
            error instanceof Error ? error.message : "Could not start the test attempt."
          )
        }
      } finally {
        const elapsedMs = Date.now() - loadingStartedAt
        const remainingLoadingMs = Math.max(0, MIN_START_ATTEMPT_LOADING_MS - elapsedMs)

        if (remainingLoadingMs > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingLoadingMs))
        }

        if (!cancelled) {
          setIsStartingAttempt(false)
        }
      }
    }

    void ensureAttemptStarted()

    return () => {
      cancelled = true
    }
  }, [isSupabase, test.id])

  const questions = test.questions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const isFirstQuestion = currentIndex === 0
  const isLastQuestion = currentIndex === totalQuestions - 1

  const supabaseQuestion = isSupabaseTakeableTest(test) ? test.questions[currentIndex] : null

  const hasCurrentAnswer = currentQuestion
    ? supabaseQuestion
      ? isSupabaseQuestionAnswered(
          supabaseAnswers,
          supabaseQuestion.id,
          supabaseQuestion.questionType
        )
      : isQuestionAnswered(mockAnswers, currentQuestion.id)
    : false

  const progress = useMemo(() => {
    if (isSupabase && isSupabaseTakeableTest(test)) {
      return getSupabaseTestTakingProgress(test.questions, supabaseAnswers)
    }

    if (!isSupabaseTakeableTest(test)) {
      return getTestTakingProgress(test.questions, mockAnswers)
    }

    return { answeredCount: 0, unansweredCount: totalQuestions, completionPercent: 0 }
  }, [isSupabase, test, supabaseAnswers, mockAnswers, totalQuestions])

  const questionStates = useMemo(
    () =>
      questions.map((question, index) => {
        if (index === currentIndex) return "current" as const
        const answered = isSupabaseTakeableTest(test)
          ? isSupabaseQuestionAnswered(
              supabaseAnswers,
              test.questions[index].id,
              test.questions[index].questionType
            )
          : isQuestionAnswered(mockAnswers, question.id)
        if (answered) return "answered" as const
        return "unanswered" as const
      }),
    [questions, currentIndex, test, supabaseAnswers, mockAnswers]
  )

  function handleSelectMockAnswer(answer: string) {
    if (!currentQuestion) return
    setMockAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: answer,
    }))
    setShowIncompleteWarning(false)
    setSubmitError(null)
  }

  function handleSelectSupabaseOptionIds(optionIds: string[]) {
    if (!currentQuestion) return
    setSupabaseAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionIds,
    }))
    setShowIncompleteWarning(false)
    setSubmitError(null)
  }

  function handleOpenTextChange(text: string) {
    if (!currentQuestion) return
    setSupabaseAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: text,
    }))
    setShowIncompleteWarning(false)
    setSubmitError(null)
  }

  function handlePrevious() {
    if (!isFirstQuestion) {
      setCurrentIndex((index) => index - 1)
      setShowIncompleteWarning(false)
    }
  }

  function handleNext() {
    if (!hasCurrentAnswer || isLastQuestion) return
    setCurrentIndex((index) => index + 1)
    setShowIncompleteWarning(false)
  }

  function handleNavigateToQuestion(index: number) {
    setCurrentIndex(index)
    setShowIncompleteWarning(false)
  }

  function handleSubmitClick() {
    if (progress.unansweredCount > 0) {
      setShowIncompleteWarning(true)
      return
    }

    void submitTest()
  }

  async function submitTest() {
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    if (isSupabase) {
      if (!attemptId) {
        setSubmitError("Test attempt is not ready yet. Please wait and try again.")
        setIsSubmitting(false)
        return
      }

      try {
        const payload = {
          attemptId,
          answers: isSupabaseTakeableTest(test)
            ? test.questions.map((question) => {
                const answer = supabaseAnswers[question.id]
                if (question.questionType === "open_question") {
                  return {
                    questionId: question.id,
                    openText: typeof answer === "string" ? answer : "",
                  }
                }

                return {
                  questionId: question.id,
                  selectedOptionIds: Array.isArray(answer) ? answer : [],
                }
              })
            : [],
        }

        const result = await submitEmployeeTestAttempt(test.id, payload)
        router.push(result.redirectTo)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to submit test.")
        setIsSubmitting(false)
      }

      return
    }

    const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000))

    window.setTimeout(() => {
      saveTakeSession(test.id, {
        answers: mockAnswers,
        submittedAt: new Date().toISOString(),
        timeSpentMinutes: elapsedMinutes,
      })
      router.push(`/employee/tests/${test.id}/result`)
    }, 700)
  }

  if (!currentQuestion) {
    return null
  }

  if (isSupabase && isStartingAttempt) {
    return (
      <div className="page-shell">
        <Breadcrumbs
          className="mb-6"
          items={[{ label: "My Tests", href: "/employee/tests" }, { label: test.title }]}
        />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="typography-p text-muted-foreground">Starting your test attempt...</p>
        </div>
      </div>
    )
  }

  if (isSupabase && startAttemptError) {
    return (
      <div className="page-shell">
        <div className="space-y-4">
          <Breadcrumbs
            items={[{ label: "My Tests", href: "/employee/tests" }, { label: test.title }]}
          />
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link href="/employee/tests">
              <ArrowLeft className="size-4" />
              Back to My Tests
            </Link>
          </Button>
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-medium text-destructive">{startAttemptError}</p>
              <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            <h1 className="typography-h1">{test.title}</h1>
            <p className="mt-1 typography-p text-muted-foreground">{test.description}</p>
          </div>
        </div>
      </div>

      <Breadcrumbs
        className="mt-6"
        items={[{ label: "My Tests", href: "/employee/tests" }, { label: test.title }]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {isSupabaseTakeableTest(test) ? (
            <TestQuestionCard
              mode="supabase"
              question={test.questions[currentIndex]}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedOptionIds={(() => {
                const answer = supabaseAnswers[test.questions[currentIndex].id]
                return Array.isArray(answer) ? answer : []
              })()}
              openText={(() => {
                const answer = supabaseAnswers[test.questions[currentIndex].id]
                return typeof answer === "string" ? answer : ""
              })()}
              onSelectOptionIds={handleSelectSupabaseOptionIds}
              onOpenTextChange={handleOpenTextChange}
            />
          ) : (
            <TestQuestionCard
              mode="mock"
              question={test.questions[currentIndex]}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={mockAnswers[currentQuestion.id]}
              onSelectAnswer={handleSelectMockAnswer}
            />
          )}

          <div className="lg:hidden">
            <TestProgressPanel
              test={test}
              answeredCount={progress.answeredCount}
              unansweredCount={progress.unansweredCount}
              completionPercent={progress.completionPercent}
              questionStates={questionStates}
              onNavigateToQuestion={handleNavigateToQuestion}
            />
          </div>

          {submitError ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{submitError}</p>
              </CardContent>
            </Card>
          ) : null}

          {showIncompleteWarning ? (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/20">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                      Some questions are unanswered
                    </p>
                    <p className="typography-small text-amber-800 dark:text-amber-400">
                      You have answered {progress.answeredCount} of {totalQuestions} questions.
                      {progress.unansweredCount > 0
                        ? ` ${progress.unansweredCount} question${progress.unansweredCount === 1 ? "" : "s"} remain unanswered.`
                        : null}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIncompleteWarning(false)}
                  >
                    Keep reviewing
                  </Button>
                  <Button type="button" onClick={() => void submitTest()} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit anyway"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <div className="flex flex-wrap gap-2">
              {!isLastQuestion ? (
                <Button type="button" onClick={handleNext} disabled={!hasCurrentAnswer}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmitClick} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Test"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <TestProgressPanel
            test={test}
            answeredCount={progress.answeredCount}
            unansweredCount={progress.unansweredCount}
            completionPercent={progress.completionPercent}
            questionStates={questionStates}
            onNavigateToQuestion={handleNavigateToQuestion}
          />
        </div>
      </div>
    </div>
  )
}
