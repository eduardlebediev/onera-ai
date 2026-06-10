import type { ReviewQuestion } from "@/features/tests/mock/generated-test-review"

const REVIEW_SESSION_PREFIX = "ontera-review-"

function getReviewSessionKey(documentId: string, generationRunId?: string | null): string {
  if (generationRunId) {
    return `${REVIEW_SESSION_PREFIX}${documentId}-${generationRunId}`
  }

  return `${REVIEW_SESSION_PREFIX}${documentId}`
}

export function clearReviewSessionsForDocument(documentId: string): void {
  if (typeof window === "undefined") return

  const prefix = `${REVIEW_SESSION_PREFIX}${documentId}`

  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (key && (key === prefix || key.startsWith(`${prefix}-`))) {
        sessionStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage errors in demo mode
  }
}

export function saveReviewSession(
  documentId: string,
  questions: ReviewQuestion[],
  generationRunId?: string | null
): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(
      getReviewSessionKey(documentId, generationRunId),
      JSON.stringify({ questions, savedAt: Date.now() })
    )
  } catch {
    // Ignore storage errors in demo mode
  }
}

export function loadReviewSession(
  documentId: string,
  generationRunId?: string | null
): ReviewQuestion[] | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(getReviewSessionKey(documentId, generationRunId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as { questions?: ReviewQuestion[] }
    return parsed.questions ?? null
  } catch {
    return null
  }
}

export function mergeReviewSession(
  documentId: string,
  baseQuestions: ReviewQuestion[],
  generationRunId?: string | null
): ReviewQuestion[] {
  const saved = loadReviewSession(documentId, generationRunId)
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
    correctAnswers: saved.correctAnswers,
    explanation: saved.explanation,
  }
}
