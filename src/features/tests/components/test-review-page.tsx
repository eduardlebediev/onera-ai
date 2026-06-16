"use client"

import { CheckCircle2, FileText, Rocket, Settings } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"

import type { DocumentStatus } from "@/features/documents/types/document"
import type { ReviewQuestion, ReviewStatus } from "@/features/tests/types/review"
import {
  DOCUMENT_STATUS_STYLE,
  getDocumentStatusLabel,
} from "@/features/documents/lib/document-status-style"
import {
  patchReviewQuestions,
  regenerateReviewQuestion,
} from "@/features/tests/lib/review-questions-api-client"
import { saveReviewSession } from "@/features/tests/lib/review-session"
import {
  useResolvedReviewData,
  type ReviewDataSource,
} from "@/features/tests/lib/use-resolved-review-data"
import {
  ReviewFilterBar,
  type ReviewStatusFilter,
} from "@/features/tests/components/review-filter-bar"
import { ReviewQuestionDetail } from "@/features/tests/components/review-question-detail"
import { ReviewQuestionList } from "@/features/tests/components/review-question-list"
import type { TestReviewData } from "@/features/tests/types/review"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Badge } from "@/shared/ui/badge"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"

interface TestReviewPageProps {
  sourceDocumentTitle: string
  sourceDocumentStatus: DocumentStatus
  reviewData: TestReviewData
  documentId: string
  generationRunId?: string | null
  draftTestId?: string | null
  reviewDataSource?: Exclude<ReviewDataSource, "session">
}

function countByStatus(questions: ReviewQuestion[], status: ReviewStatus): number {
  return questions.filter((question) => question.status === status).length
}

export function TestReviewPage({
  sourceDocumentTitle,
  sourceDocumentStatus,
  reviewData: fallbackReviewData,
  documentId,
  generationRunId: routeGenerationRunId,
  draftTestId: routeDraftTestId,
  reviewDataSource = "supabase",
}: TestReviewPageProps) {
  const { t } = useTranslation()
  const {
    reviewData,
    questions: resolvedQuestions,
    isAiDraft,
    generationRunId,
    draftTestId: resolvedDraftTestId,
    isHydrated,
  } = useResolvedReviewData(documentId, fallbackReviewData, routeGenerationRunId, reviewDataSource)

  const [questionsOverride, setQuestionsOverride] = useState<ReviewQuestion[] | null>(null)
  const questions = questionsOverride ?? resolvedQuestions

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    fallbackReviewData.questions.length > 0 ? fallbackReviewData.questions[0].id : null
  )
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const updateQuestions = (updater: (current: ReviewQuestion[]) => ReviewQuestion[]) => {
    setQuestionsOverride((previous) => {
      const base = previous ?? resolvedQuestions
      return updater(base)
    })
  }

  const totalQuestions = questions.length
  const approvedQuestions = useMemo(() => countByStatus(questions, "approved"), [questions])
  const rejectedQuestions = useMemo(() => countByStatus(questions, "rejected"), [questions])
  const editedQuestions = useMemo(() => countByStatus(questions, "edited"), [questions])

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return questions.filter((q) => {
      const matchesStatus = statusFilter === "all" || q.status === statusFilter
      const matchesTopic = topicFilter === "all" || q.topic === topicFilter
      const matchesSearch =
        normalizedQuery === "" ||
        q.questionText.toLowerCase().includes(normalizedQuery) ||
        q.topic.toLowerCase().includes(normalizedQuery)
      return matchesStatus && matchesTopic && matchesSearch
    })
  }, [questions, statusFilter, searchQuery, topicFilter])

  const selectedQuestionIndex = useMemo(() => {
    const index = questions.findIndex((q) => q.id === selectedQuestionId)
    if (index !== -1) return index
    return questions.length > 0 ? 0 : -1
  }, [questions, selectedQuestionId])
  const selectedQuestion = selectedQuestionIndex !== -1 ? questions[selectedQuestionIndex] : null

  const canPublish = approvedQuestions > 0
  const draftTestId = routeDraftTestId ?? resolvedDraftTestId ?? null

  function buildQuestionPayload(question: ReviewQuestion, orderIndex: number) {
    const options =
      question.questionType === "open_question"
        ? []
        : question.options.map((text, index) => ({
            id: `opt-${String.fromCharCode(97 + index)}`,
            text,
          }))
    const optionIdByText = new Map(options.map((option) => [option.text, option.id]))
    const correctTexts =
      question.correctAnswers && question.correctAnswers.length > 0
        ? question.correctAnswers
        : [question.correctAnswer]
    const optionIds = correctTexts
      .map((text) => optionIdByText.get(text))
      .filter((optionId): optionId is string => Boolean(optionId))

    return {
      id: question.dbQuestionId,
      clientId: question.clientId ?? question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      options,
      correctAnswer:
        question.questionType === "open_question"
          ? { expectedAnswer: question.expectedAnswer ?? question.correctAnswer }
          : { optionIds: optionIds.length > 0 ? optionIds : options.slice(0, 1).map((o) => o.id) },
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      reviewStatus: question.status,
      sourceChunkId: question.sourceChunkId ?? null,
      isAiGenerated: question.isAiGenerated,
      orderIndex,
    }
  }

  function resolveQuestionOrderIndex(question: ReviewQuestion): number {
    const index = questions.findIndex(
      (item) =>
        item.id === question.id ||
        (question.dbQuestionId && item.dbQuestionId === question.dbQuestionId)
    )

    return index >= 0 ? index : questions.length
  }

  async function persistQuestionChanges(input: {
    upsert?: ReviewQuestion[]
    deleteIds?: string[]
  }): Promise<{ upserted: Array<{ clientId?: string; id: string }>; deletedIds: string[] } | void> {
    if (!draftTestId) return

    return patchReviewQuestions(draftTestId, {
      upsert: input.upsert?.map((question) =>
        buildQuestionPayload(question, resolveQuestionOrderIndex(question))
      ),
      deleteIds: input.deleteIds,
    })
  }

  useEffect(() => {
    if (!isHydrated) return
    saveReviewSession(documentId, questions, generationRunId)
  }, [documentId, generationRunId, isHydrated, questions])

  const handleContinueToPublish = () => {
    saveReviewSession(documentId, questions, generationRunId)
  }

  const handleStatusFilterChange = (tab: ReviewStatusFilter) => {
    setStatusFilter(tab)
    const firstVisible = questions.find((q) => tab === "all" || q.status === tab)
    if (firstVisible) setSelectedQuestionId(firstVisible.id)
  }

  const handleSetStatus = (questionId: string, status: ReviewStatus) => {
    updateQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? { ...question, status } : question))
    )

    const nextQuestion = questions.find((question) => question.id === questionId)
    if (!nextQuestion) return

    void persistQuestionChanges({
      upsert: [{ ...nextQuestion, status }],
    }).catch((error) => {
      setActionError(
        error instanceof Error ? error.message : t("tests.review.errors.saveReviewStatus")
      )
    })
  }

  const handleSaveEdit = (questionId: string, patch: Partial<ReviewQuestion>) => {
    updateQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, ...patch, status: "edited" } : question
      )
    )

    if (!draftTestId) return

    const nextQuestion = questions.find((question) => question.id === questionId)
    if (!nextQuestion) return

    void persistQuestionChanges({
      upsert: [{ ...nextQuestion, ...patch, status: "edited" }],
    }).catch((error) => {
      setActionError(
        error instanceof Error ? error.message : t("tests.review.errors.saveQuestionEdit")
      )
    })
  }

  const handleAddQuestion = (question: ReviewQuestion) => {
    updateQuestions((prev) => [...prev, question])
    setSelectedQuestionId(question.id)

    if (!draftTestId) return

    void persistQuestionChanges({ upsert: [question] })
      .then((result) => {
        if (!result) return
        const mappedId = result.upserted.find((item) => item.clientId === question.clientId)?.id
        if (!mappedId) return

        const persistedQuestionId = `db-${mappedId}`
        updateQuestions((prev) =>
          prev.map((item) =>
            item.id === question.id
              ? { ...item, dbQuestionId: mappedId, id: persistedQuestionId }
              : item
          )
        )
        setSelectedQuestionId(persistedQuestionId)
      })
      .catch((error) => {
        setActionError(
          error instanceof Error ? error.message : t("tests.review.errors.addQuestion")
        )
      })
  }

  const handleDeleteQuestion = (questionId: string) => {
    const questionToDelete = questions.find((question) => question.id === questionId)
    updateQuestions((prev) => prev.filter((question) => question.id !== questionId))
    setSelectedQuestionId((current) => {
      if (current !== questionId) return current
      const remaining = questions.filter((question) => question.id !== questionId)
      return remaining[0]?.id ?? null
    })

    if (!draftTestId || !questionToDelete?.dbQuestionId) return

    void persistQuestionChanges({ deleteIds: [questionToDelete.dbQuestionId] }).catch((error) => {
      setActionError(
        error instanceof Error ? error.message : t("tests.review.errors.deleteQuestion")
      )
    })
  }

  const handleRegenerateQuestion = async (questionId: string) => {
    const question = questions.find((item) => item.id === questionId)
    if (!question?.dbQuestionId || !draftTestId) {
      setActionError(t("tests.review.errors.regenerateOnlyPersisted"))
      return
    }

    setRegeneratingQuestionId(questionId)
    setActionError(null)

    try {
      const regenerated = await regenerateReviewQuestion(draftTestId, question.dbQuestionId)
      updateQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId
            ? {
                ...item,
                ...regenerated,
                id: regenerated.id,
                dbQuestionId: regenerated.dbQuestionId,
                status: "needs_review",
              }
            : item
        )
      )
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("tests.review.errors.regenerateQuestion")
      )
    } finally {
      setRegeneratingQuestionId(null)
    }
  }

  const handlePrevious = () => {
    if (selectedQuestionIndex > 0) {
      setSelectedQuestionId(questions[selectedQuestionIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionId(questions[selectedQuestionIndex + 1].id)
    }
  }

  const statusBadge = DOCUMENT_STATUS_STYLE[sourceDocumentStatus]
  const publishHref = useMemo(() => {
    const params = new URLSearchParams({ documentId })

    if (generationRunId) {
      params.set("runId", generationRunId)
    }

    return `/admin/tests/publish?${params.toString()}`
  }, [documentId, generationRunId])

  return (
    <div className="page-shell flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mb-6 shrink-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {t("tests.review.title")}
              </h1>
              <p className="mt-1 text-base text-muted-foreground">{reviewData.testTitle}</p>
              {reviewData.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{reviewData.description}</p>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground">
                {isAiDraft ? t("common.aiGeneratedDraft") : t("common.aiGeneratedReviewHint")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              {reviewData.sourceDocuments && reviewData.sourceDocuments.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  {reviewData.sourceDocuments.map((sourceDocument) => (
                    <Badge key={sourceDocument.id} variant="secondary" className="font-normal">
                      {sourceDocument.title}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{sourceDocumentTitle}</span>
                </div>
              )}
              <Badge variant="outline" className={`font-normal ${statusBadge.badgeClass}`}>
                <span className={`mr-1.5 flex size-1.5 rounded-full ${statusBadge.dotClass}`} />
                {getDocumentStatusLabel(sourceDocumentStatus, t)}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t("tests.review.questionsCount", { count: totalQuestions })}</span>
                <span className="size-1 rounded-full bg-border" />
                <span className="capitalize">
                  {t(`common.difficulty.${reviewData.difficulty}`)}
                </span>
                <span className="size-1 rounded-full bg-border" />
                <span>{reviewData.targetRole}</span>
                <span className="size-1 rounded-full bg-border" />
                <span>{reviewData.language}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-muted-foreground">
                {t("common.ofQuestionsApproved", {
                  approved: approvedQuestions,
                  total: totalQuestions,
                })}
              </span>
              {!canPublish && (
                <span className="text-xs text-amber-600 font-medium">
                  {t("tests.review.approveAtLeastOne")}
                </span>
              )}
            </div>

            {actionError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href={`/admin/documents/${documentId}/generate-test`}>
                <Settings className="mr-2 size-4" />
                {t("tests.review.testSetup")}
              </Link>
            </Button>
            <Button
              asChild={canPublish}
              disabled={!canPublish}
              className="h-10 px-4 bg-foreground text-background"
            >
              {canPublish ? (
                <Link href={publishHref} onClick={handleContinueToPublish}>
                  <Rocket className="mr-2 size-4" />
                  {t("tests.review.continueToPublish")}
                </Link>
              ) : (
                <>
                  <Rocket className="mr-2 size-4" />
                  {t("tests.review.continueToPublish")}
                </>
              )}
            </Button>
          </div>
        </div>

        <Breadcrumbs
          className="mt-4"
          items={[
            { label: t("nav.tests"), href: "/admin/tests" },
            { label: t("tests.review.breadcrumbReview") },
          ]}
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0 bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="px-6 pt-4 shrink-0 bg-card rounded-t-xl">
          <ReviewFilterBar
            totalQuestions={totalQuestions}
            approvedCount={approvedQuestions}
            editedCount={editedQuestions}
            rejectedCount={rejectedQuestions}
            activeTab={statusFilter}
            onTabChange={handleStatusFilterChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            topics={reviewData.selectedTopics}
            topicFilter={topicFilter}
            onTopicFilterChange={setTopicFilter}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-card rounded-b-xl overflow-hidden">
          <div className="lg:col-span-4 min-h-0 border-r border-border/50">
            <ReviewQuestionList
              questions={filteredQuestions}
              allQuestionsCount={totalQuestions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onApprove={(id) => handleSetStatus(id, "approved")}
              topics={reviewData.selectedTopics}
              showAddForm={showAddForm}
              onToggleAddForm={() => setShowAddForm((value) => !value)}
              onAddQuestion={handleAddQuestion}
            />
          </div>
          <div className="lg:col-span-8 min-h-0 bg-card">
            {selectedQuestion ? (
              <ReviewQuestionDetail
                question={selectedQuestion}
                questionNumber={selectedQuestionIndex + 1}
                totalQuestions={totalQuestions}
                onApprove={(id) => handleSetStatus(id, "approved")}
                onReject={(id) => handleSetStatus(id, "rejected")}
                onSaveEdit={handleSaveEdit}
                onDelete={handleDeleteQuestion}
                onRegenerate={handleRegenerateQuestion}
                isRegenerating={regeneratingQuestionId === selectedQuestion.id}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card">
                <p className="text-sm text-muted-foreground">{t("tests.review.selectQuestion")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
