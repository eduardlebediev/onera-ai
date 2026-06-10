import { mockDocuments, type MockDocumentDetail } from "@/data/mock/documents"

/** Seeded Supabase demo document UUIDs (see supabase/seed.sql). */
export const DEMO_SECURITY_GUIDELINES_UUID = "c0000000-0000-4000-8000-000000000001"
export const DEMO_SUPPORT_ESCALATION_UUID = "c0000000-0000-4000-8000-000000000002"

const MOCK_ID_BY_UUID: Record<string, string> = {
  [DEMO_SECURITY_GUIDELINES_UUID]: "doc-1",
  [DEMO_SUPPORT_ESCALATION_UUID]: "doc-4",
}

const UUID_BY_MOCK_ID: Record<string, string> = {
  "doc-1": DEMO_SECURITY_GUIDELINES_UUID,
  "doc-4": DEMO_SUPPORT_ESCALATION_UUID,
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function resolveMockDocumentByRouteId(routeId: string): MockDocumentDetail | undefined {
  const mockId = MOCK_ID_BY_UUID[routeId] ?? routeId
  return mockDocuments.find((document) => document.id === mockId)
}

/** Route id used for links and review-session keys (mock id when mapped). */
export function resolveReviewDocumentRouteId(routeId: string): string {
  if (MOCK_ID_BY_UUID[routeId]) {
    return MOCK_ID_BY_UUID[routeId]
  }

  return routeId
}

/** Document id sent to POST /api/admin/generate-test. */
export function resolveApiDocumentId(routeId: string): string | null {
  if (UUID_BY_MOCK_ID[routeId]) {
    return UUID_BY_MOCK_ID[routeId]
  }

  if (isUuid(routeId)) {
    return routeId
  }

  return null
}

export function hasApiBackedDocument(routeId: string): boolean {
  return resolveApiDocumentId(routeId) !== null
}
