"use client"

import { CheckCircle2, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"

import type { ReviewQuestion } from "@/features/tests/mock/generated-test-review"
import type { QuestionType } from "@/features/tests/schemas/generated-test-schema"
import { Button } from "@/shared/ui/button"

const QUESTION_TYPE_OPTIONS: Array<{ value: QuestionType; label: string }> = [
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / false" },
  { value: "open_question", label: "Open question" },
]

function defaultOptionsForType(questionType: QuestionType): string[] {
  if (questionType === "true_false") return ["True", "False"]
  if (questionType === "open_question") return []
  return ["Option A", "Option B", "Option C", "Option D"]
}

function createManualQuestionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `manual-${crypto.randomUUID()}`
  }

  return `manual-${Date.now()}`
}

interface ManualQuestionFormProps {
  topics: string[]
  onAdd: (question: ReviewQuestion) => void
  onCancel: () => void
}

export function ManualQuestionForm({ topics, onAdd, onCancel }: ManualQuestionFormProps) {
  const [questionType, setQuestionType] = useState<QuestionType>("single_choice")
  const [questionText, setQuestionText] = useState("")
  const [options, setOptions] = useState<string[]>(defaultOptionsForType("single_choice"))
  const [correctAnswer, setCorrectAnswer] = useState(
    defaultOptionsForType("single_choice")[0] ?? ""
  )
  const [expectedAnswer, setExpectedAnswer] = useState("")
  const [explanation, setExplanation] = useState("")
  const [topic, setTopic] = useState(topics[0] ?? "General")
  const [validationError, setValidationError] = useState<string | null>(null)

  const isOpenQuestion = questionType === "open_question"

  const canSubmit = useMemo(() => {
    if (!questionText.trim() || !explanation.trim() || !topic.trim()) return false
    if (isOpenQuestion) return expectedAnswer.trim().length > 0
    return options.some((option) => option.trim().length > 0) && correctAnswer.trim().length > 0
  }, [correctAnswer, explanation, isOpenQuestion, expectedAnswer, options, questionText, topic])

  const handleQuestionTypeChange = (nextType: QuestionType) => {
    setQuestionType(nextType)
    const nextOptions = defaultOptionsForType(nextType)
    setOptions(nextOptions)
    setCorrectAnswer(nextOptions[0] ?? "")
    setExpectedAnswer("")
  }

  const handleOptionTextChange = (index: number, value: string) => {
    setOptions((previous) => {
      const next = [...previous]
      if (previous[index] === correctAnswer) {
        setCorrectAnswer(value)
      }
      next[index] = value
      return next
    })
  }

  const handleSubmit = () => {
    setValidationError(null)

    if (!canSubmit) {
      setValidationError(
        isOpenQuestion
          ? "Add question text, expected answer, explanation, and topic."
          : "Add question text, at least one option, a correct answer, explanation, and topic."
      )
      return
    }

    const resolvedOptions = isOpenQuestion
      ? []
      : options.map((option, index) => option.trim() || `Option ${String.fromCharCode(65 + index)}`)
    const resolvedCorrect = isOpenQuestion
      ? expectedAnswer.trim()
      : resolvedOptions.includes(correctAnswer.trim())
        ? correctAnswer.trim()
        : resolvedOptions[0]

    if (!isOpenQuestion && !resolvedCorrect) {
      setValidationError("Select a correct answer before adding the question.")
      return
    }

    onAdd({
      id: createManualQuestionId(),
      clientId: createManualQuestionId(),
      questionText: questionText.trim(),
      questionType,
      options: resolvedOptions,
      correctAnswer: resolvedCorrect,
      correctAnswers: isOpenQuestion ? [resolvedCorrect] : [resolvedCorrect],
      expectedAnswer: isOpenQuestion ? resolvedCorrect : undefined,
      explanation: explanation.trim(),
      topic: topic.trim(),
      sourceChunkReference: "Manual question",
      testedSkill: "Knowledge recall",
      pedagogicalGoal: "Verify understanding through a manually authored question",
      difficulty: "medium",
      whyUseful: "Added manually during admin review.",
      status: "approved",
      isAiGenerated: false,
    })
  }

  return (
    <div className="rounded-xl border border-border/50 bg-background p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">Add manual question</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-muted-foreground">Question type</span>
          <select
            value={questionType}
            onChange={(event) => handleQuestionTypeChange(event.target.value as QuestionType)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {QUESTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-muted-foreground">Topic</span>
          <input
            list="manual-question-topics"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <datalist id="manual-question-topics">
            {topics.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="font-medium text-muted-foreground">Question</span>
        <textarea
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
        />
      </label>

      {isOpenQuestion ? (
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-muted-foreground">Expected answer</span>
          <textarea
            value={expectedAnswer}
            onChange={(event) => setExpectedAnswer(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
          />
        </label>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Options</p>
          {options.map((option, index) => {
            const letter = String.fromCharCode(65 + index)
            const isCorrect = option === correctAnswer

            return (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isCorrect
                    ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10"
                    : "border-border/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(option)}
                  aria-label={`Mark option ${letter} as correct answer`}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                    isCorrect
                      ? "border-green-400 bg-green-500 text-white"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isCorrect ? <CheckCircle2 className="size-4" /> : letter}
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(event) => handleOptionTextChange(index, event.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            )
          })}
        </div>
      )}

      <label className="block space-y-2 text-sm">
        <span className="font-medium text-muted-foreground">Explanation</span>
        <textarea
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none"
        />
      </label>

      {validationError ? <p className="text-sm text-destructive">{validationError}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          <Plus className="mr-2 size-4" />
          Add question
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
