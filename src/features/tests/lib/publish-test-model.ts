import type { MockDocumentDetail } from "@/data/mock/documents"
import type {
  MockTestReviewData,
  ReviewQuestion,
  ReviewStatus,
} from "@/features/tests/mock/generated-test-review"

export type PublishReadinessStatus = "ready" | "needs_attention"

export interface PublishReadinessCheck {
  id: string
  label: string
  status: PublishReadinessStatus
  helperText: string
  required: boolean
}

export interface PublishTestContext {
  documentId: string
  sourceDocumentTitle: string
  sourceDocumentStatus: MockDocumentDetail["status"]
  reviewData: MockTestReviewData
  totalQuestions: number
  approvedCount: number
  rejectedCount: number
  editedCount: number
  needsReviewCount: number
  passingScore: number
  selectedChunksCount: number
}

function countByStatus(questions: ReviewQuestion[], status: ReviewStatus): number {
  return questions.filter((question) => question.status === status).length
}

export function buildPublishContext(
  document: MockDocumentDetail,
  reviewData: MockTestReviewData
): PublishTestContext {
  const questions = reviewData.questions

  return {
    documentId: document.id,
    sourceDocumentTitle: document.title,
    sourceDocumentStatus: document.status,
    reviewData,
    totalQuestions: questions.length,
    approvedCount: countByStatus(questions, "approved"),
    rejectedCount: countByStatus(questions, "rejected"),
    editedCount: countByStatus(questions, "edited"),
    needsReviewCount: countByStatus(questions, "needs_review"),
    passingScore: reviewData.passingScore,
    selectedChunksCount: reviewData.selectedChunksCount,
  }
}

export function getApprovedQuestions(reviewData: MockTestReviewData): ReviewQuestion[] {
  return reviewData.questions.filter((question) => question.status === "approved")
}

export function getPublishableQuestions(reviewData: MockTestReviewData): ReviewQuestion[] {
  return reviewData.questions.filter(
    (question) => question.status === "approved" || question.status === "edited"
  )
}

export function getPublishReadinessChecks(context: PublishTestContext): PublishReadinessCheck[] {
  const { reviewData, approvedCount, needsReviewCount } = context
  const hasSourceDocument = Boolean(context.sourceDocumentTitle)
  const hasTestTitle = reviewData.testTitle.trim().length > 0
  const hasApprovedQuestion = approvedCount > 0
  const hasPassingScore = reviewData.passingScore > 0
  const hasTopics = reviewData.selectedTopics.length > 0
  const allQuestionsReviewed = needsReviewCount === 0

  return [
    {
      id: "source-document",
      label: "Source document selected",
      status: hasSourceDocument ? "ready" : "needs_attention",
      helperText: hasSourceDocument
        ? `${context.sourceDocumentTitle} is linked to this test.`
        : "Select a source document before publishing.",
      required: true,
    },
    {
      id: "test-title",
      label: "Test title configured",
      status: hasTestTitle ? "ready" : "needs_attention",
      helperText: hasTestTitle
        ? "The test has a clear title for employees and admins."
        : "Add a test title before publishing.",
      required: true,
    },
    {
      id: "approved-questions",
      label: "At least one approved question",
      status: hasApprovedQuestion ? "ready" : "needs_attention",
      helperText: hasApprovedQuestion
        ? `${approvedCount} approved question${approvedCount === 1 ? "" : "s"} will be published.`
        : "Approve at least one question before publishing this test.",
      required: true,
    },
    {
      id: "passing-score",
      label: "Passing score configured",
      status: hasPassingScore ? "ready" : "needs_attention",
      helperText: hasPassingScore
        ? `Employees must score at least ${reviewData.passingScore}% to pass.`
        : "Set a passing score before publishing.",
      required: true,
    },
    {
      id: "topics",
      label: "Topics selected",
      status: hasTopics ? "ready" : "needs_attention",
      helperText: hasTopics
        ? `${reviewData.selectedTopics.length} topic${reviewData.selectedTopics.length === 1 ? "" : "s"} included in this test.`
        : "Select at least one topic before publishing.",
      required: true,
    },
    {
      id: "questions-reviewed",
      label: "Questions reviewed",
      status: allQuestionsReviewed ? "ready" : "needs_attention",
      helperText: allQuestionsReviewed
        ? "All generated questions have been reviewed."
        : `${needsReviewCount} question${needsReviewCount === 1 ? "" : "s"} still need review.`,
      required: false,
    },
  ]
}

export function isPublishReady(checks: PublishReadinessCheck[]): boolean {
  return checks.filter((check) => check.required).every((check) => check.status === "ready")
}

export function getPublishBlockReason(checks: PublishReadinessCheck[]): string {
  const failingCheck = checks.find((check) => check.required && check.status === "needs_attention")
  return failingCheck?.helperText ?? "Complete the required checks before publishing."
}

export function resolvePublishedTestId(documentId: string): string {
  return documentId
}
