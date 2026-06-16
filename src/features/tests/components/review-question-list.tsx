import type { ReviewQuestion, ReviewStatus } from "@/features/tests/types/review"
import { ManualQuestionForm } from "@/features/tests/components/manual-question-form"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

interface ReviewQuestionListProps {
  questions: ReviewQuestion[]
  allQuestionsCount: number
  selectedQuestionId: string | null
  onSelectQuestion: (questionId: string) => void
  onApproveAll?: () => void
  canApproveAll?: boolean
  topics: string[]
  showAddForm: boolean
  onToggleAddForm: () => void
  onAddQuestion: (question: ReviewQuestion) => void
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

export function ReviewQuestionList({
  questions,
  allQuestionsCount,
  selectedQuestionId,
  onSelectQuestion,
  onApproveAll,
  canApproveAll = false,
  topics,
  showAddForm,
  onToggleAddForm,
  onAddQuestion,
}: ReviewQuestionListProps) {
  return (
    <div className="flex flex-col bg-card">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Questions</h3>
        <div className="flex items-center gap-2">
          {onApproveAll ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canApproveAll}
              onClick={onApproveAll}
              className="h-7 border-green-200 px-2.5 text-xs font-medium text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              Approve all
            </Button>
          ) : null}
          <span className="text-sm font-medium text-muted-foreground">
            {questions.length === allQuestionsCount
              ? allQuestionsCount
              : `${questions.length} of ${allQuestionsCount}`}
          </span>
        </div>
      </div>

      <div className="max-h-[800px] overflow-y-auto p-4 space-y-2">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center pt-8">
            No questions match the current filters.
          </p>
        ) : (
          questions.map((question, index) => {
            const isSelected = question.id === selectedQuestionId
            const statusVariant = getStatusBadgeVariant(question.status)

            return (
              <div key={question.id}>
                <button
                  type="button"
                  onClick={() => onSelectQuestion(question.id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left rounded-xl p-4 transition-colors border focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    isSelected
                      ? "bg-background border-border shadow-sm"
                      : "bg-background/50 border-transparent hover:bg-background hover:border-border/50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {question.questionText}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {question.topic}
                        </span>
                        <Badge
                          variant={statusVariant === "outline" ? "secondary" : statusVariant}
                          className={`capitalize text-[10px] h-5 px-2 font-medium shrink-0 ${
                            statusVariant === "outline"
                              ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50"
                              : ""
                          }`}
                        >
                          {statusVariant === "outline" ? "Pending" : toStatusLabel(question.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-center p-4 border-t border-border/50">
        {showAddForm ? (
          <ManualQuestionForm
            topics={topics}
            onAdd={(question) => {
              onAddQuestion(question)
              onToggleAddForm()
            }}
            onCancel={onToggleAddForm}
          />
        ) : (
          <Button type="button" variant="outline" className="w-full" onClick={onToggleAddForm}>
            Add question
          </Button>
        )}
      </div>
    </div>
  )
}
