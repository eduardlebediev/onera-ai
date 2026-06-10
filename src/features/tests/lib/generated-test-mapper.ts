import type {
  MockTestReviewData,
  ReviewDifficulty,
  ReviewLanguage,
  ReviewQuestion,
} from "@/features/tests/mock/generated-test-review"
import type { GeneratedTestQuestion } from "@/features/tests/schemas/generated-test-schema"
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
  const sourceChunkReference = question.sourceChunkTitle?.trim()
    ? `Source: ${question.sourceChunkTitle}`
    : `Source: ${question.sourceChunkId}`

  return {
    id: `ai-${generationRunId}-q-${index + 1}`,
    questionText: question.questionText,
    options: question.options.map((option) => option.text),
    correctAnswer: primaryCorrectAnswer,
    correctAnswers: correctAnswerTexts.length > 0 ? correctAnswerTexts : [primaryCorrectAnswer],
    explanation: question.explanation,
    topic: question.topic,
    sourceChunkReference,
    testedSkill: "Knowledge recall",
    pedagogicalGoal: "Verify understanding of source document content",
    difficulty: question.difficulty as ReviewDifficulty,
    whyUseful: "Grounded in retrieved document chunks for admin review before publishing.",
    status: "needs_review",
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
    questions: draft.questions.map((question, index) =>
      mapQuestionToReviewQuestion(question, index, stored.generationRunId)
    ),
  }
}
