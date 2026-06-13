import type {
  MockTestReviewData,
  ReviewDifficulty,
  ReviewLanguage,
  ReviewQuestion,
  ReviewStatus,
} from "@/features/tests/mock/generated-test-review"
import { buildSourceLabel } from "@/features/tests/lib/source-label"
import type { GeneratedTestQuestion } from "@/features/tests/schemas/generated-test-schema"
import type {
  PublishGeneratedQuestion,
  PublishGeneratedTestRequest,
} from "@/features/tests/schemas/publish-generated-test-schema"
import type { StoredGeneratedTestDraft } from "@/features/tests/types/generated-test"

function toReviewLanguage(language: "en" | "de"): ReviewLanguage {
  return language === "de" ? "German" : "English"
}

function resolveCorrectAnswerTexts(question: GeneratedTestQuestion): string[] {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]))

  return question.correctAnswer.optionIds
    .map((optionId) => optionById.get(optionId))
    .filter((text): text is string => Boolean(text))
}

function mapQuestionToReviewQuestion(
  question: GeneratedTestQuestion,
  index: number,
  generationRunId: string
): ReviewQuestion {
  const correctAnswerTexts = resolveCorrectAnswerTexts(question)
  const primaryCorrectAnswer = correctAnswerTexts[0] ?? question.options[0]?.text ?? ""
  const documentTitle = question.sourceDocumentTitle ?? "Source document"
  const sourceChunkReference = buildSourceLabel({
    documentTitle,
    topic: question.topic,
    chunkTitle: question.sourceChunkTitle,
  })

  return {
    id: `ai-${generationRunId}-q-${index + 1}`,
    questionText: question.questionText,
    options: question.options.map((option) => option.text),
    correctAnswer: primaryCorrectAnswer,
    correctAnswers: correctAnswerTexts.length > 0 ? correctAnswerTexts : [primaryCorrectAnswer],
    explanation: question.explanation,
    topic: question.topic,
    sourceChunkReference,
    sourceDocumentTitle: documentTitle,
    testedSkill: "Knowledge recall",
    pedagogicalGoal: "Verify understanding of source document content",
    difficulty: question.difficulty as ReviewDifficulty,
    whyUseful: "Grounded in retrieved document chunks for admin review before publishing.",
    status: "needs_review",
  }
}

function mapReviewStatusToPublishStatus(
  status: ReviewStatus
): PublishGeneratedQuestion["reviewStatus"] {
  if (status === "rejected") return "rejected"
  if (status === "edited") return "needs_edit"
  if (status === "approved") return "approved"
  return undefined
}

function getReviewCorrectAnswerTexts(question: ReviewQuestion): string[] {
  if (question.correctAnswers && question.correctAnswers.length > 0) {
    return question.correctAnswers
  }

  return [question.correctAnswer]
}

function applyReviewEditsToQuestion(
  baseQuestion: GeneratedTestQuestion,
  reviewQuestion: ReviewQuestion
): GeneratedTestQuestion {
  const updatedOptions = baseQuestion.options.map((option, index) => ({
    id: option.id,
    text: reviewQuestion.options[index] ?? option.text,
  }))

  const optionIdByText = new Map(updatedOptions.map((option) => [option.text, option.id]))
  const correctTexts = getReviewCorrectAnswerTexts(reviewQuestion)
  const optionIds = correctTexts
    .map((text) => optionIdByText.get(text))
    .filter((optionId): optionId is string => Boolean(optionId))

  const fallbackOptionId = updatedOptions[0]?.id
  const resolvedOptionIds =
    optionIds.length > 0 ? optionIds : fallbackOptionId ? [fallbackOptionId] : []

  return {
    ...baseQuestion,
    questionText: reviewQuestion.questionText,
    options: updatedOptions,
    correctAnswer: {
      optionIds: resolvedOptionIds,
    },
    explanation: reviewQuestion.explanation,
    topic: reviewQuestion.topic,
    difficulty: reviewQuestion.difficulty,
  }
}

function mapGeneratedQuestionToPublishQuestion(
  question: GeneratedTestQuestion,
  orderIndex: number,
  reviewStatus?: PublishGeneratedQuestion["reviewStatus"]
): PublishGeneratedQuestion {
  return {
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    topic: question.topic,
    difficulty: question.difficulty,
    sourceChunkId: question.sourceChunkId,
    sourceChunkTitle: question.sourceChunkTitle,
    orderIndex,
    reviewStatus,
  }
}

export function mapReviewedDraftToPublishRequest(
  stored: StoredGeneratedTestDraft,
  reviewedQuestions: ReviewQuestion[]
): PublishGeneratedTestRequest {
  const reviewById = new Map(reviewedQuestions.map((question) => [question.id, question]))
  const publishQuestions: PublishGeneratedQuestion[] = []
  const documentIds = stored.documents.map((document) => document.id)

  stored.draft.questions.forEach((draftQuestion, index) => {
    const reviewId = `ai-${stored.generationRunId}-q-${index + 1}`
    const reviewQuestion = reviewById.get(reviewId)

    if (!reviewQuestion) return

    const publishStatus = mapReviewStatusToPublishStatus(reviewQuestion.status)

    if (publishStatus === "rejected") {
      publishQuestions.push(mapGeneratedQuestionToPublishQuestion(draftQuestion, index, "rejected"))
      return
    }

    if (reviewQuestion.status !== "approved" && reviewQuestion.status !== "edited") {
      return
    }

    const mergedQuestion =
      reviewQuestion.status === "edited"
        ? applyReviewEditsToQuestion(draftQuestion, reviewQuestion)
        : draftQuestion

    publishQuestions.push(
      mapGeneratedQuestionToPublishQuestion(
        mergedQuestion,
        publishQuestions.length,
        publishStatus === "needs_edit" ? "needs_edit" : "approved"
      )
    )
  })

  return {
    generationRunId: stored.generationRunId,
    documentId: documentIds[0],
    documentIds,
    title: stored.draft.title,
    description: stored.draft.description,
    difficulty: stored.draft.difficulty,
    language: stored.draft.language,
    targetRole: stored.draft.targetRole,
    passingScore: stored.draft.passingScore,
    questions: publishQuestions,
  }
}

export function mapStoredDraftToReviewData(
  stored: StoredGeneratedTestDraft,
  selectedTopics?: string[],
  selectedChunksCount?: number
): MockTestReviewData {
  const draft = stored.draft
  const topicsFromQuestions = [...new Set(draft.questions.map((question) => question.topic))]

  return {
    testTitle: draft.title,
    description: draft.description,
    difficulty: draft.difficulty as ReviewDifficulty,
    targetRole: draft.targetRole,
    questionCount: draft.questions.length,
    language: toReviewLanguage(draft.language),
    passingScore: draft.passingScore,
    selectedChunksCount: selectedChunksCount ?? stored.retrievedChunks.length,
    selectedTopics: selectedTopics ?? topicsFromQuestions,
    sourceDocuments: stored.documents.map((document) => ({
      id: document.id,
      title: document.title,
    })),
    questions: draft.questions.map((question, index) =>
      mapQuestionToReviewQuestion(question, index, stored.generationRunId)
    ),
  }
}
