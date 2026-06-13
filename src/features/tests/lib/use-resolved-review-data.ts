"use client"

import { useSyncExternalStore } from "react"

import { resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { mapStoredDraftToReviewData } from "@/features/tests/lib/generated-test-mapper"
import {
  draftMatchesDocumentContext,
  loadGeneratedTestDraft,
} from "@/features/tests/lib/generated-test-session"
import { mergeReviewSession } from "@/features/tests/lib/review-session"
import type {
  MockTestReviewData,
  ReviewQuestion,
} from "@/features/tests/mock/generated-test-review"

export type ReviewDataSource = "session" | "supabase" | "mock"

let cachedClientSnapshot: { key: string; state: ResolvedReviewState } | null = null
let cachedServerSnapshot: { key: string; state: ResolvedReviewState } | null = null

export interface ResolvedReviewState {
  reviewData: MockTestReviewData
  questions: ReviewQuestion[]
  isAiDraft: boolean
  generationRunId: string | null
  isHydrated: boolean
  source: ReviewDataSource
}

function getServerState(
  documentId: string,
  fallbackReviewData: MockTestReviewData,
  fallbackSource: Exclude<ReviewDataSource, "session">,
  generationRunId?: string | null
): ResolvedReviewState {
  const cacheKey = JSON.stringify({
    documentId,
    fallbackSource,
    generationRunId,
    testTitle: fallbackReviewData.testTitle,
    questionIds: fallbackReviewData.questions.map((question) => question.id),
  })

  if (cachedServerSnapshot?.key === cacheKey) {
    return cachedServerSnapshot.state
  }

  const state = {
    reviewData: fallbackReviewData,
    questions: fallbackReviewData.questions,
    isAiDraft: fallbackSource === "supabase",
    generationRunId: fallbackSource === "supabase" ? (generationRunId ?? null) : null,
    isHydrated: false,
    source: fallbackSource,
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
    source: state.source,
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
  fallbackReviewData: MockTestReviewData,
  generationRunId?: string | null,
  fallbackSource: Exclude<ReviewDataSource, "session"> = "mock"
): ResolvedReviewState {
  const stored = loadGeneratedTestDraft()
  const apiDocumentId = resolveApiDocumentId(documentId) ?? documentId

  if (stored && draftMatchesDocumentContext(stored, apiDocumentId, generationRunId)) {
    const mappedReviewData = mapStoredDraftToReviewData(stored)
    const runId = stored.generationRunId
    const mergedQuestions = mergeReviewSession(documentId, mappedReviewData.questions, runId)
    const state: ResolvedReviewState = {
      reviewData: mappedReviewData,
      questions: mergedQuestions,
      isAiDraft: true,
      generationRunId: runId,
      isHydrated: true,
      source: "session",
    }
    const cacheKey = buildClientCacheKey(documentId, fallbackReviewData, state)

    if (cachedClientSnapshot?.key === cacheKey) {
      return cachedClientSnapshot.state
    }

    cachedClientSnapshot = { key: cacheKey, state }

    return state
  }

  const fallbackGenerationRunId = fallbackSource === "supabase" ? (generationRunId ?? null) : null
  const mergedQuestions = mergeReviewSession(
    documentId,
    fallbackReviewData.questions,
    fallbackGenerationRunId
  )
  const state: ResolvedReviewState = {
    reviewData: fallbackReviewData,
    questions: mergedQuestions,
    isAiDraft: fallbackSource === "supabase",
    generationRunId: fallbackGenerationRunId,
    isHydrated: true,
    source: fallbackSource,
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
  fallbackReviewData: MockTestReviewData,
  generationRunId?: string | null,
  fallbackSource: Exclude<ReviewDataSource, "session"> = "mock"
): ResolvedReviewState {
  return useSyncExternalStore(
    () => () => {},
    () => buildResolvedState(documentId, fallbackReviewData, generationRunId, fallbackSource),
    () => getServerState(documentId, fallbackReviewData, fallbackSource, generationRunId)
  )
}
