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
  return {
    reviewData: fallbackReviewData,
    questions: fallbackReviewData.questions,
    isAiDraft: false,
    generationRunId: null,
    isHydrated: false,
  }
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

    return {
      reviewData: mappedReviewData,
      questions: mergeReviewSession(documentId, mappedReviewData.questions, runId),
      isAiDraft: true,
      generationRunId: runId,
      isHydrated: true,
    }
  }

  return {
    reviewData: fallbackReviewData,
    questions: mergeReviewSession(documentId, fallbackReviewData.questions),
    isAiDraft: false,
    generationRunId: null,
    isHydrated: true,
  }
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
