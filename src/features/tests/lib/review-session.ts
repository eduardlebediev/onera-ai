import type { ReviewQuestion } from "@/features/tests/mock/generated-test-review"

const REVIEW_SESSION_PREFIX = "ontera-review-"

function getReviewSessionKey(documentId: string): string {
  return `${REVIEW_SESSION_PREFIX}${documentId}`
}

export function saveReviewSession(documentId: string, questions: ReviewQuestion[]): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(
      getReviewSessionKey(documentId),
      JSON.stringify({ questions, savedAt: Date.now() })
    )
  } catch {
    // Ignore storage errors in demo mode
  }
}

export function loadReviewSession(documentId: string): ReviewQuestion[] | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(getReviewSessionKey(documentId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as { questions?: ReviewQuestion[] }
    return parsed.questions ?? null
  } catch {
    return null
  }
}

export function mergeReviewSession(
  documentId: string,
  baseQuestions: ReviewQuestion[]
): ReviewQuestion[] {
  const saved = loadReviewSession(documentId)
  if (!saved) return baseQuestions

  const savedById = new Map(saved.map((question) => [question.id, question]))

  return baseQuestions.map((question) => {
    const savedQuestion = savedById.get(question.id)
    if (!savedQuestion) return question
    return { ...question, status: savedQuestion.status, ...pickEditedFields(savedQuestion) }
  })
}

function pickEditedFields(saved: ReviewQuestion): Partial<ReviewQuestion> {
  if (saved.status !== "edited") return {}

  return {
    questionText: saved.questionText,
    options: saved.options,
    correctAnswer: saved.correctAnswer,
    explanation: saved.explanation,
  }
}
