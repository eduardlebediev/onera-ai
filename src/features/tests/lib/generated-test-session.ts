import { resolveReviewDocumentRouteId } from "@/features/documents/lib/demo-document-ids"
import type { GeneratedTestResponse } from "@/features/tests/schemas/generated-test-schema"
import { StoredGeneratedTestDraftSchema } from "@/features/tests/schemas/generated-test-schema"
import type { StoredGeneratedTestDraft } from "@/features/tests/types/generated-test"
import { clearReviewSessionsForDocument } from "@/features/tests/lib/review-session"

export const GENERATED_TEST_DRAFT_KEY = "ontera.generatedTestDraft"

export function saveGeneratedTestDraft(response: GeneratedTestResponse): void {
  if (typeof window === "undefined") return

  for (const document of response.documents) {
    const reviewDocumentId = resolveReviewDocumentRouteId(document.id)
    clearReviewSessionsForDocument(reviewDocumentId)
  }

  const payload: StoredGeneratedTestDraft = {
    generationRunId: response.generationRunId,
    testId: response.testId,
    targetEmployeeIds: response.targetEmployeeIds,
    document: response.document,
    documents: response.documents,
    draft: response.draft,
    retrievedChunks: response.retrievedChunks,
    createdAt: new Date().toISOString(),
  }

  try {
    sessionStorage.setItem(GENERATED_TEST_DRAFT_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage errors in demo mode
  }
}

export function loadGeneratedTestDraft(): StoredGeneratedTestDraft | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(GENERATED_TEST_DRAFT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const validated = StoredGeneratedTestDraftSchema.safeParse(parsed)

    if (!validated.success) {
      return null
    }

    return validated.data
  } catch {
    return null
  }
}

export function clearGeneratedTestDraft(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem(GENERATED_TEST_DRAFT_KEY)
  } catch {
    // Ignore storage errors in demo mode
  }
}

export function draftMatchesDocumentContext(
  stored: StoredGeneratedTestDraft,
  documentId: string,
  generationRunId?: string | null
): boolean {
  if (generationRunId && stored.generationRunId === generationRunId) {
    return true
  }

  const normalizedDocumentIds = new Set(
    stored.documents.map((document) => resolveReviewDocumentRouteId(document.id))
  )

  return normalizedDocumentIds.has(documentId)
}
