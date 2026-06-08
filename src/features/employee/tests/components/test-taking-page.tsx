"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

import { TestProgressPanel } from "@/features/employee/tests/components/test-progress-panel"
import { TestQuestionCard } from "@/features/employee/tests/components/test-question-card"
import {
  getTestTakingProgress,
  isQuestionAnswered,
  type EmployeeTakeableTest,
  type TestTakingAnswers,
} from "@/features/employee/tests/lib/test-taking-state"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface TestTakingPageProps {
  test: EmployeeTakeableTest
}

export function TestTakingPage({ test }: TestTakingPageProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<TestTakingAnswers>({})
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false)

  const questions = test.questions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const isFirstQuestion = currentIndex === 0
  const isLastQuestion = currentIndex === totalQuestions - 1
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const hasCurrentAnswer = currentQuestion ? isQuestionAnswered(answers, currentQuestion.id) : false

  const progress = useMemo(() => getTestTakingProgress(questions, answers), [questions, answers])

  const questionStates = useMemo(
    () =>
      questions.map((question, index) => {
        if (index === currentIndex) return "current" as const
        if (isQuestionAnswered(answers, question.id)) return "answered" as const
        return "unanswered" as const
      }),
    [questions, answers, currentIndex]
  )

  function handleSelectAnswer(answer: string) {
    if (!currentQuestion) return
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: answer,
    }))
    setShowIncompleteWarning(false)
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

    submitTest()
  }

  function submitTest() {
    router.push(`/employee/tests/${test.id}/result`)
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link href="/employee/tests">
              <ArrowLeft className="size-4" />
              Back to My Tests
            </Link>
          </Button>
          <div>
            <h1 className="typography-h1">{test.title}</h1>
            <p className="mt-1 typography-p text-muted-foreground">{test.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <TestQuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={totalQuestions}
            selectedAnswer={currentAnswer}
            onSelectAnswer={handleSelectAnswer}
          />

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
                  <Button type="button" onClick={submitTest}>
                    Submit anyway
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
                <Button type="button" onClick={handleSubmitClick}>
                  Submit Test
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
