type EmployeeSourceDocumentRouteOptions = {
  testId?: string
  attemptId?: string
}

export function getEmployeeSourceDocumentHref(
  documentId: string,
  options?: EmployeeSourceDocumentRouteOptions | string
): string {
  const normalizedOptions: EmployeeSourceDocumentRouteOptions =
    typeof options === "string" ? { testId: options } : (options ?? {})

  const params = new URLSearchParams()

  if (normalizedOptions.testId) {
    params.set("testId", normalizedOptions.testId)
  }

  if (normalizedOptions.attemptId) {
    params.set("attemptId", normalizedOptions.attemptId)
  }

  const query = params.toString()
  return `/employee/documents/${documentId}${query ? `?${query}` : ""}`
}

export function getEmployeeTestResultHref(testId: string, attemptId?: string): string {
  if (!attemptId) {
    return `/employee/tests/${testId}/result`
  }

  const params = new URLSearchParams({ attemptId })
  return `/employee/tests/${testId}/result?${params.toString()}`
}
