"use client"

import { ArrowLeft, CheckCircle2, FileText, Rocket, Settings } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"

import type { DocumentStatus } from "@/data/mock/documents"
import type { ReviewQuestion, ReviewStatus } from "@/features/tests/mock/generated-test-review"
import { DOCUMENT_STATUS_STYLE } from "@/features/documents/lib/document-status-style"
import { saveReviewSession } from "@/features/tests/lib/review-session"
import { useResolvedReviewData } from "@/features/tests/lib/use-resolved-review-data"
import {
  ReviewFilterBar,
  type ReviewStatusFilter,
} from "@/features/tests/components/review-filter-bar"
import { ReviewQuestionDetail } from "@/features/tests/components/review-question-detail"
import { ReviewQuestionList } from "@/features/tests/components/review-question-list"
import type { MockTestReviewData } from "@/features/tests/mock/generated-test-review"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

interface TestReviewPageProps {
  sourceDocumentTitle: string
  sourceDocumentStatus: DocumentStatus
  reviewData: MockTestReviewData
  documentId: string
}

function countByStatus(questions: ReviewQuestion[], status: ReviewStatus): number {
  return questions.filter((question) => question.status === status).length
}

export function TestReviewPage({
  sourceDocumentTitle,
  sourceDocumentStatus,
  reviewData: fallbackReviewData,
  documentId,
}: TestReviewPageProps) {
  const {
    reviewData,
    questions: resolvedQuestions,
    isAiDraft,
    generationRunId,
    isHydrated,
  } = useResolvedReviewData(documentId, fallbackReviewData)

  const [questionsOverride, setQuestionsOverride] = useState<ReviewQuestion[] | null>(null)
  const questions = questionsOverride ?? resolvedQuestions

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    fallbackReviewData.questions.length > 0 ? fallbackReviewData.questions[0].id : null
  )
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState("all")

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
  }

  const handleSaveEdit = (questionId: string, patch: Partial<ReviewQuestion>) => {
    updateQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, ...patch, status: "edited" } : question
      )
    )
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

  return (
    <div className="page-shell flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mb-6 shrink-0">
        <Link
          href={`/admin/documents/${documentId}`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Document
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Test Review</h1>
              <p className="mt-1 text-base text-muted-foreground">{reviewData.testTitle}</p>
              {reviewData.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{reviewData.description}</p>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground">
                {isAiDraft
                  ? "AI-generated draft. Review before publishing."
                  : "AI-generated questions stay in review until an admin approves them."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{sourceDocumentTitle}</span>
              </div>
              <Badge variant="outline" className={`font-normal ${statusBadge.badgeClass}`}>
                <span className={`mr-1.5 flex size-1.5 rounded-full ${statusBadge.dotClass}`} />
                {statusBadge.label}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{totalQuestions} Questions</span>
                <span className="size-1 rounded-full bg-border" />
                <span className="capitalize">{reviewData.difficulty}</span>
                <span className="size-1 rounded-full bg-border" />
                <span>{reviewData.targetRole}</span>
                <span className="size-1 rounded-full bg-border" />
                <span>{reviewData.language}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{approvedQuestions}</span> of{" "}
                {totalQuestions} questions approved
              </span>
              {!canPublish && (
                <span className="text-xs text-amber-600 font-medium">
                  — approve at least one to publish
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href={`/admin/documents/${documentId}/generate-test`}>
                <Settings className="mr-2 size-4" />
                Test Setup
              </Link>
            </Button>
            <Button
              asChild={canPublish}
              disabled={!canPublish}
              className="h-10 px-4 bg-foreground text-background"
            >
              {canPublish ? (
                <Link
                  href={`/admin/tests/publish?documentId=${encodeURIComponent(documentId)}`}
                  onClick={handleContinueToPublish}
                >
                  <Rocket className="mr-2 size-4" />
                  Continue to Publish
                </Link>
              ) : (
                <>
                  <Rocket className="mr-2 size-4" />
                  Continue to Publish
                </>
              )}
            </Button>
          </div>
        </div>
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
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card">
                <p className="text-sm text-muted-foreground">Select a question to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
