import type { DocumentDetail } from "@/features/documents/types/document"
import type { TestReviewData, ReviewQuestion, ReviewStatus } from "@/features/tests/types/review"
import type { createTranslator } from "@/shared/i18n/translate"

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
  sourceDocumentStatus: DocumentDetail["status"]
  reviewData: TestReviewData
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
  document: DocumentDetail,
  reviewData: TestReviewData
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

export function getApprovedQuestions(reviewData: TestReviewData): ReviewQuestion[] {
  return reviewData.questions.filter((question) => question.status === "approved")
}

export function getPublishableQuestions(reviewData: TestReviewData): ReviewQuestion[] {
  return reviewData.questions.filter(
    (question) => question.status === "approved" || question.status === "edited"
  )
}

export function getPublishReadinessChecks(
  context: PublishTestContext,
  t: ReturnType<typeof createTranslator>["t"]
): PublishReadinessCheck[] {
  const { reviewData, approvedCount, needsReviewCount } = context
  const hasSourceDocument = Boolean(context.sourceDocumentTitle)
  const hasTestTitle = reviewData.testTitle.trim().length > 0
  const hasApprovedQuestion = approvedCount > 0
  const hasPassingScore = reviewData.passingScore > 0
  const hasTopics = reviewData.selectedTopics.length > 0
  const allQuestionsReviewed = needsReviewCount === 0
  const topicCount = reviewData.selectedTopics.length

  return [
    {
      id: "source-document",
      label: t("tests.publish.readiness.checks.sourceDocument"),
      status: hasSourceDocument ? "ready" : "needs_attention",
      helperText: hasSourceDocument
        ? t("tests.publish.readiness.checks.sourceDocumentReady", {
            title: context.sourceDocumentTitle,
          })
        : t("tests.publish.readiness.checks.sourceDocumentMissing"),
      required: true,
    },
    {
      id: "test-title",
      label: t("tests.publish.readiness.checks.testTitle"),
      status: hasTestTitle ? "ready" : "needs_attention",
      helperText: hasTestTitle
        ? t("tests.publish.readiness.checks.testTitleReady")
        : t("tests.publish.readiness.checks.testTitleMissing"),
      required: true,
    },
    {
      id: "approved-questions",
      label: t("tests.publish.readiness.checks.approvedQuestions"),
      status: hasApprovedQuestion ? "ready" : "needs_attention",
      helperText: hasApprovedQuestion
        ? t("tests.publish.readiness.checks.approvedQuestionsReady", {
            count: approvedCount,
            plural: approvedCount === 1 ? "" : "s",
          })
        : t("tests.publish.readiness.checks.approvedQuestionsMissing"),
      required: true,
    },
    {
      id: "passing-score",
      label: t("tests.publish.readiness.checks.passingScore"),
      status: hasPassingScore ? "ready" : "needs_attention",
      helperText: hasPassingScore
        ? t("tests.publish.readiness.checks.passingScoreReady", {
            score: reviewData.passingScore,
          })
        : t("tests.publish.readiness.checks.passingScoreMissing"),
      required: true,
    },
    {
      id: "topics",
      label: t("tests.publish.readiness.checks.topics"),
      status: hasTopics ? "ready" : "needs_attention",
      helperText: hasTopics
        ? t("tests.publish.readiness.checks.topicsReady", {
            count: topicCount,
            plural: topicCount === 1 ? "" : "s",
          })
        : t("tests.publish.readiness.checks.topicsMissing"),
      required: true,
    },
    {
      id: "questions-reviewed",
      label: t("tests.publish.readiness.checks.questionsReviewed"),
      status: allQuestionsReviewed ? "ready" : "needs_attention",
      helperText: allQuestionsReviewed
        ? t("tests.publish.readiness.checks.questionsReviewedReady")
        : t("tests.publish.readiness.checks.questionsReviewedPending", {
            count: needsReviewCount,
            plural: needsReviewCount === 1 ? "" : "s",
          }),
      required: false,
    },
  ]
}

export function isPublishReady(checks: PublishReadinessCheck[]): boolean {
  return checks.filter((check) => check.required).every((check) => check.status === "ready")
}

export function getPublishBlockReason(
  checks: PublishReadinessCheck[],
  t: ReturnType<typeof createTranslator>["t"]
): string {
  const failingCheck = checks.find((check) => check.required && check.status === "needs_attention")
  return failingCheck?.helperText ?? t("tests.publish.readiness.blockReason")
}

export function resolvePublishedTestId(documentId: string): string {
  return documentId
}
