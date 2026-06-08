"use client"

import { ArrowLeft, CheckCircle2, FileText, Rocket, Settings } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import type { DocumentStatus } from "@/data/mock/documents"
import type {
  MockTestReviewData,
  ReviewQuestion,
  ReviewStatus,
} from "@/features/tests/mock/generated-test-review"
import {
  ReviewFilterBar,
  type ReviewStatusFilter,
} from "@/features/tests/components/review-filter-bar"
import { ReviewQuestionDetail } from "@/features/tests/components/review-question-detail"
import { ReviewQuestionList } from "@/features/tests/components/review-question-list"
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

const STATUS_BADGE: Record<
  DocumentStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  ready: {
    label: "Ready",
    dotClass: "bg-green-500",
    badgeClass:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400",
  },
  processing: {
    label: "Processing",
    dotClass: "bg-orange-500",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  },
  uploaded: {
    label: "Uploaded",
    dotClass: "bg-muted-foreground",
    badgeClass: "border-border bg-muted text-muted-foreground",
  },
}

export function TestReviewPage({
  sourceDocumentTitle,
  sourceDocumentStatus,
  reviewData,
  documentId,
}: TestReviewPageProps) {
  const [questions, setQuestions] = useState<ReviewQuestion[]>(reviewData.questions)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  )
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState("all")

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

  const selectedQuestionIndex = useMemo(
    () => questions.findIndex((q) => q.id === selectedQuestionId),
    [questions, selectedQuestionId]
  )
  const selectedQuestion = selectedQuestionIndex !== -1 ? questions[selectedQuestionIndex] : null

  const canPublish = approvedQuestions > 0

  const handleStatusFilterChange = (tab: ReviewStatusFilter) => {
    setStatusFilter(tab)
    const firstVisible = questions.find((q) => tab === "all" || q.status === tab)
    if (firstVisible) setSelectedQuestionId(firstVisible.id)
  }

  const handleSetStatus = (questionId: string, status: ReviewStatus) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? { ...question, status } : question))
    )
  }

  const handleSaveEdit = (questionId: string, patch: Partial<ReviewQuestion>) => {
    setQuestions((prev) =>
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

  const statusBadge = STATUS_BADGE[sourceDocumentStatus]

  return (
    <div className="page-shell flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mb-6 shrink-0">
        <Link
          href={`/documents/${documentId}`}
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

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href={`/documents/${documentId}/generate-test`}>
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
                <Link href={`/tests/publish?documentId=${encodeURIComponent(documentId)}`}>
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
