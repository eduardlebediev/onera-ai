"use client"

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  RotateCw,
  Save,
  X,
  XCircle,
} from "lucide-react"
import { useState } from "react"

import type { ReviewQuestion, ReviewStatus } from "@/features/tests/mock/generated-test-review"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

interface ReviewQuestionDetailProps {
  question: ReviewQuestion
  questionNumber: number
  totalQuestions: number
  onApprove: (questionId: string) => void
  onReject: (questionId: string) => void
  onSaveEdit: (questionId: string, patch: Partial<ReviewQuestion>) => void
  onPrevious: () => void
  onNext: () => void
}

function getStatusBadgeVariant(
  status: ReviewStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default"
    case "rejected":
      return "destructive"
    case "edited":
      return "secondary"
    case "needs_review":
    default:
      return "outline"
  }
}

function toStatusLabel(status: ReviewStatus): string {
  return status.replace(/_/g, " ")
}

function getCorrectAnswerTexts(question: ReviewQuestion): string[] {
  if (question.correctAnswers && question.correctAnswers.length > 0) {
    return question.correctAnswers
  }

  return [question.correctAnswer]
}

function isCorrectOption(option: string, question: ReviewQuestion): boolean {
  return getCorrectAnswerTexts(question).includes(option)
}

export function ReviewQuestionDetail({
  question,
  questionNumber,
  totalQuestions,
  onApprove,
  onReject,
  onSaveEdit,
  onPrevious,
  onNext,
}: ReviewQuestionDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(question.questionText)
  const [editOptions, setEditOptions] = useState<string[]>(question.options)
  const [editCorrectAnswer, setEditCorrectAnswer] = useState(question.correctAnswer)
  const [editExplanation, setEditExplanation] = useState(question.explanation)

  const statusVariant = getStatusBadgeVariant(question.status)

  const handleStartEdit = () => {
    setEditText(question.questionText)
    setEditOptions([...question.options])
    setEditCorrectAnswer(question.correctAnswer)
    setEditExplanation(question.explanation)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleOptionTextChange = (index: number, value: string) => {
    setEditOptions((prev) => {
      const next = [...prev]
      // If the option being edited was the correct answer, update correctAnswer to follow the new text
      if (prev[index] === editCorrectAnswer) {
        setEditCorrectAnswer(value)
      }
      next[index] = value
      return next
    })
  }

  const handleSave = () => {
    const resolvedText = editText.trim() || question.questionText
    const resolvedOptions = editOptions.map((o, i) => o.trim() || question.options[i])
    // If the saved correct answer is no longer among options, fall back to the first option
    const resolvedCorrect = resolvedOptions.includes(editCorrectAnswer)
      ? editCorrectAnswer
      : resolvedOptions[0]

    onSaveEdit(question.id, {
      questionText: resolvedText,
      options: resolvedOptions,
      correctAnswer: resolvedCorrect,
      correctAnswers: [resolvedCorrect],
      explanation: editExplanation.trim() || question.explanation,
    })
    setIsEditing(false)
  }

  const correctAnswerIndices = question.options
    .map((option, index) => (isCorrectOption(option, question) ? index : -1))
    .filter((index) => index >= 0)

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header: navigation + status */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onPrevious}
            disabled={questionNumber <= 1}
            aria-label="Previous question"
            className="flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium text-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
          <button
            onClick={onNext}
            disabled={questionNumber >= totalQuestions}
            aria-label="Next question"
            className="flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Review Status</span>
          <Badge
            variant={statusVariant === "outline" ? "secondary" : statusVariant}
            className={`capitalize h-6 px-3 ${
              statusVariant === "outline"
                ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50"
                : ""
            }`}
          >
            {statusVariant === "outline" ? (
              <>
                <RotateCw className="mr-1.5 size-3" />
                Pending Review
              </>
            ) : (
              toStatusLabel(question.status)
            )}
          </Badge>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main content column */}
        <div className="lg:col-span-8 p-6 lg:p-8 overflow-y-auto border-r border-border/50">
          <div className="space-y-8">
            {/* Question text */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Question</h4>
              {isEditing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  aria-label="Question text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                />
              ) : (
                <p className="text-lg font-medium text-foreground leading-snug">
                  {question.questionText}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Options</h4>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Click a circle to set the correct answer
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {isEditing
                  ? editOptions.map((option, index) => {
                      const letter = String.fromCharCode(65 + index)
                      const isCorrect = option === editCorrectAnswer

                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            isCorrect
                              ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                              : "border-border/50 bg-background"
                          }`}
                        >
                          {/* Correct answer selector */}
                          <button
                            type="button"
                            onClick={() => setEditCorrectAnswer(option)}
                            aria-label={`Mark option ${letter} as correct answer`}
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                              isCorrect
                                ? "border-green-400 bg-green-500 text-white hover:bg-green-600"
                                : "border-border text-muted-foreground hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 className="size-4" /> : letter}
                          </button>
                          {/* Option text input */}
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionTextChange(index, e.target.value)}
                            aria-label={`Option ${letter} text`}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                        </div>
                      )
                    })
                  : question.options.map((option, index) => {
                      const isCorrect = isCorrectOption(option, question)
                      const letter = String.fromCharCode(65 + index)

                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            isCorrect
                              ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                              : "border-border/50 bg-background"
                          }`}
                        >
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                              isCorrect
                                ? "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/50 dark:text-green-400"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {letter}
                          </div>
                          <p
                            className={`flex-1 text-sm ${isCorrect ? "font-medium text-foreground" : "text-foreground"}`}
                          >
                            {option}
                          </p>
                          {isCorrect && (
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                              <CheckCircle2 className="size-4" />
                            </div>
                          )}
                        </div>
                      )
                    })}
              </div>
            </div>

            {/* Explanation (always shown in edit mode; shown in sidebar in view mode) */}
            {isEditing && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Explanation</h4>
                <textarea
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  rows={3}
                  aria-label="Explanation text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    className="h-10 px-6 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={handleSave}
                  >
                    <Save className="mr-2 size-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" className="h-10 px-6" onClick={handleCancelEdit}>
                    <X className="mr-2 size-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="h-10 px-6 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={() => onApprove(question.id)}
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    Approve
                  </Button>
                  <Button variant="outline" className="h-10 px-6" onClick={handleStartEdit}>
                    <PencilLine className="mr-2 size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-6 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => onReject(question.id)}
                  >
                    <XCircle className="mr-2 size-4" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-6 ml-auto"
                    disabled
                    title="Regenerate is not yet implemented"
                  >
                    <RotateCw className="mr-2 size-4" />
                    Regenerate
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-8">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Correct Answer</h4>
              <div className="flex flex-wrap gap-2">
                {correctAnswerIndices.length > 0 ? (
                  correctAnswerIndices.map((index) => (
                    <div
                      key={index}
                      className="flex size-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                  ))
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                    ?
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Explanation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {question.explanation}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Topic</h4>
              <Badge
                variant="secondary"
                className="bg-purple-50 text-purple-700 hover:bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 font-normal"
              >
                {question.topic}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Difficulty</h4>
              <Badge
                variant="secondary"
                className="capitalize bg-muted text-muted-foreground hover:bg-muted font-normal"
              >
                {question.difficulty}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Source Chunk</h4>
              <p className="text-sm text-foreground">{question.sourceChunkReference}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Tested Skill</h4>
              <p className="text-sm text-muted-foreground">{question.testedSkill}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Pedagogical Goal</h4>
              <p className="text-sm text-muted-foreground">{question.pedagogicalGoal}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Why Useful</h4>
              <p className="text-sm text-muted-foreground">{question.whyUseful}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
