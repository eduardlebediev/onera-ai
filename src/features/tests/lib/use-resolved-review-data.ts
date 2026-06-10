"use client"

import { useSyncExternalStore } from "react"

import { resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { mapStoredDraftToReviewData } from "@/features/tests/lib/generated-test-mapper"
import { loadGeneratedTestDraft } from "@/features/tests/lib/generated-test-session"
import { mergeReviewSession } from "@/features/tests/lib/review-session"
import type {
  MockTestReviewData,
  ReviewQuestion,
} from "@/features/tests/mock/generated-test-review"

let cachedClientSnapshot: { key: string; state: ResolvedReviewState } | null = null
let cachedServerSnapshot: { key: string; state: ResolvedReviewState } | null = null

export interface ResolvedReviewState {
  reviewData: MockTestReviewData
  questions: ReviewQuestion[]
  isAiDraft: boolean
  generationRunId: string | null
  isHydrated: boolean
}

function getServerState(
  documentId: string,
  fallbackReviewData: MockTestReviewData
): ResolvedReviewState {
  const cacheKey = JSON.stringify({
    documentId,
    testTitle: fallbackReviewData.testTitle,
    questionIds: fallbackReviewData.questions.map((question) => question.id),
  })

  if (cachedServerSnapshot?.key === cacheKey) {
    return cachedServerSnapshot.state
  }

  const state = {
    reviewData: fallbackReviewData,
    questions: fallbackReviewData.questions,
    isAiDraft: false,
    generationRunId: null,
    isHydrated: false,
  }

  cachedServerSnapshot = { key: cacheKey, state }

  return state
}

function buildClientCacheKey(
  documentId: string,
  fallbackReviewData: MockTestReviewData,
  state: ResolvedReviewState
): string {
  return JSON.stringify({
    documentId,
    isAiDraft: state.isAiDraft,
    generationRunId: state.generationRunId,
    title: state.reviewData.testTitle,
    passingScore: state.reviewData.passingScore,
    questionStates: state.questions.map((question) => ({
      id: question.id,
      status: question.status,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      correctAnswers: question.correctAnswers,
      explanation: question.explanation,
    })),
    fallbackQuestionIds: fallbackReviewData.questions.map((question) => question.id),
  })
}

function buildResolvedState(
  documentId: string,
  fallbackReviewData: MockTestReviewData
): ResolvedReviewState {
  const stored = loadGeneratedTestDraft()
  const apiDocumentId = resolveApiDocumentId(documentId) ?? documentId

  if (stored && stored.document.id === apiDocumentId) {
    const mappedReviewData = mapStoredDraftToReviewData(stored)
    const runId = stored.generationRunId
    const mergedQuestions = mergeReviewSession(documentId, mappedReviewData.questions, runId)
    const state = {
      reviewData: mappedReviewData,
      questions: mergedQuestions,
      isAiDraft: true,
      generationRunId: runId,
      isHydrated: true,
    }
    const cacheKey = buildClientCacheKey(documentId, fallbackReviewData, state)

    if (cachedClientSnapshot?.key === cacheKey) {
      return cachedClientSnapshot.state
    }

    cachedClientSnapshot = { key: cacheKey, state }

    return state
  }

  const mergedQuestions = mergeReviewSession(documentId, fallbackReviewData.questions)
  const state = {
    reviewData: fallbackReviewData,
    questions: mergedQuestions,
    isAiDraft: false,
    generationRunId: null,
    isHydrated: true,
  }
  const cacheKey = buildClientCacheKey(documentId, fallbackReviewData, state)

  if (cachedClientSnapshot?.key === cacheKey) {
    return cachedClientSnapshot.state
  }

  cachedClientSnapshot = { key: cacheKey, state }

  return state
}

export function useResolvedReviewData(
  documentId: string,
  fallbackReviewData: MockTestReviewData
): ResolvedReviewState {
  return useSyncExternalStore(
    () => () => {},
    () => buildResolvedState(documentId, fallbackReviewData),
    () => getServerState(documentId, fallbackReviewData)
  )
}
