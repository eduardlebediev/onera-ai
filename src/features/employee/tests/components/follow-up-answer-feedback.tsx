"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle2, RotateCcw, XCircle } from "lucide-react"

import type { FollowUpQuestion } from "@/features/employee/tests/types/follow-up"
import { getEmployeeSourceDocumentHref } from "@/features/employee/documents/lib/employee-source-document-route"
import {
  formatDifficultyLabel,
  getPassFailBadgeClass,
} from "@/features/employee/tests/lib/employee-test-model"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { cn } from "@/lib/utils"

interface FollowUpAnswerFeedbackProps {
  followUp: FollowUpQuestion
  isCorrect: boolean
  sourceDocumentId: string
  testId?: string
  onTryAnother: () => void
  onBackToResults: () => void
  showTryAgain?: boolean
}

export function FollowUpAnswerFeedback({
  followUp,
  isCorrect,
  sourceDocumentId,
  testId,
  onTryAnother,
  onBackToResults,
  showTryAgain = true,
}: FollowUpAnswerFeedbackProps) {
  const { t } = useTranslation()
  const correctOption = followUp.options.find((option) => option.id === followUp.correctOptionId)
  const StatusIcon = isCorrect ? CheckCircle2 : XCircle
  const statusLabel = isCorrect
    ? t("employee.result.topicUnderstood")
    : t("employee.result.reviewRecommended")
  const suggestedAction = isCorrect
    ? t("employee.followUp.understoodAction")
    : t("employee.followUp.reviewAction")

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border p-4",
        isCorrect
          ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/20 dark:bg-emerald-900/10"
          : "border-amber-200/60 bg-amber-50/40 dark:border-amber-900/20 dark:bg-amber-900/10"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className={cn("gap-1", getPassFailBadgeClass(isCorrect))}>
          <StatusIcon className="size-3" />
          {statusLabel}
        </Badge>
      </div>

      <div className="space-y-1">
        <p className="typography-label text-muted-foreground">
          {t("employee.result.correctAnswer")}
        </p>
        <p className="typography-small font-medium">{correctOption?.label ?? t("common.dash")}</p>
      </div>

      <div className="space-y-1">
        <p className="typography-label text-muted-foreground">{t("employee.result.explanation")}</p>
        <p className="typography-small">{followUp.explanationAfterAnswer}</p>
      </div>

      <div className="space-y-1">
        <p className="typography-label text-muted-foreground">
          {t("employee.followUp.suggestedNextAction")}
        </p>
        <p className="typography-small text-muted-foreground">{suggestedAction}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={getEmployeeSourceDocumentHref(sourceDocumentId, { testId })}>
            <BookOpen className="size-4" />
            {t("employee.followUp.reviewSourceMaterial")}
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onBackToResults}>
          <ArrowLeft className="size-4" />
          {t("employee.followUp.backToResults")}
        </Button>
        {showTryAgain ? (
          <Button type="button" variant="outline" size="sm" onClick={onTryAnother}>
            <RotateCcw className="size-4" />
            {t("common.tryAgain")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function FollowUpQuestionMeta({ followUp }: { followUp: FollowUpQuestion }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="text-[11px] font-medium">
        <BookOpen className="mr-1 size-3" />
        {followUp.topic}
      </Badge>
      <Badge variant="outline" className="text-[11px] font-medium">
        {formatDifficultyLabel(followUp.difficulty, t)}
      </Badge>
      <Badge variant="outline" className="text-[11px] font-medium">
        {followUp.learningGoal}
      </Badge>
    </div>
  )
}
