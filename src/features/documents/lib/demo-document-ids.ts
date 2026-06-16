const MOCK_TEST_ID_PATTERN = /^test-\d+$/
const MOCK_DOCUMENT_ID_PATTERN = /^doc-\d+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function isMockTestId(value: string): boolean {
  return MOCK_TEST_ID_PATTERN.test(value)
}

export function isMockDocumentId(value: string): boolean {
  return MOCK_DOCUMENT_ID_PATTERN.test(value)
}

/** Route id used for links and review-session keys. */
export function resolveReviewDocumentRouteId(routeId: string): string {
  return routeId
}

/** Document id sent to POST /api/admin/generate-test. */
export function resolveApiDocumentId(routeId: string): string | null {
  if (isUuid(routeId)) {
    return routeId
  }

  return null
}

export function hasApiBackedDocument(routeId: string): boolean {
  return resolveApiDocumentId(routeId) !== null
}
