import type { DocumentStatus } from "@/features/documents/types/document"
import type { TestListItem, TestSourceDocumentRef } from "@/features/tests/types/test"

export interface ResolvedTestSourceDocument extends TestSourceDocumentRef {
  title: string
  status: DocumentStatus
}

export type ResolvedTestListItem = Omit<TestListItem, "sourceDocument"> & {
  sourceDocument: ResolvedTestSourceDocument
}
