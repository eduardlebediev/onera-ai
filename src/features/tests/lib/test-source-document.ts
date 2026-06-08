import { mockDocuments, type DocumentStatus } from "@/data/mock/documents"
import type { MockTest, TestSourceDocumentRef } from "@/features/tests/mock/tests"

export interface ResolvedTestSourceDocument extends TestSourceDocumentRef {
  title: string
  status: DocumentStatus
}

export type ResolvedMockTest = Omit<MockTest, "sourceDocument"> & {
  sourceDocument: ResolvedTestSourceDocument
}

export function resolveTestSourceDocument(ref: TestSourceDocumentRef): ResolvedTestSourceDocument {
  const document = mockDocuments.find((item) => item.id === ref.documentId)

  if (!document) {
    return {
      ...ref,
      title: "Unknown document",
      status: "failed",
    }
  }

  return {
    ...ref,
    title: document.title,
    status: document.status,
  }
}

export function resolveMockTest(test: MockTest): ResolvedMockTest {
  return {
    ...test,
    sourceDocument: resolveTestSourceDocument(test.sourceDocument),
  }
}

export function getResolvedMockTestById(
  tests: MockTest[],
  id: string
): ResolvedMockTest | undefined {
  const test = tests.find((item) => item.id === id)
  return test ? resolveMockTest(test) : undefined
}
