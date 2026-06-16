export type DocumentStatus = "ready" | "processing" | "failed" | "uploaded" | "archived" | "deleted"
export type DocumentFileType = "pdf" | "docx" | "pptx" | "txt" | "md"

export interface DocumentChunk {
  id: string
  content: string
  topic: string
  chunkIndex: number
}

export interface LinkedTest {
  id: string
  title: string
  questionCount: number
  status: "draft" | "published"
}

export interface DocumentVersion {
  id: string
  version: number
  uploadedAt: string
  status: DocumentStatus
  isLatest?: boolean
  isCurrent?: boolean
  changeMessage?: string | null
  aiChangeSummary?: string | null
  newerVersionId?: string | null
}

export interface DocumentTopic {
  id?: string
  topic: string
  description?: string | null
  confidence?: number | null
  source?: string
}

export interface DocumentDetail {
  id: string
  title: string
  status: DocumentStatus
  fileType: DocumentFileType
  fileSizeMb: number
  fileName?: string
  description: string
  uploadedAt: string
  /** Full document text when available from backend extraction. */
  extractedText?: string
  extractionMethod?: string | null
  processingError?: string | null
  processedAt?: string | null
  hasEmbeddedChunks?: boolean
  canDownloadOriginal?: boolean
  supportsArchiveDelete?: boolean
  sourceType?: string
  versionNumber?: number
  isLatestVersion?: boolean
  latestDocumentId?: string
  newerVersionId?: string | null
  changeMessage?: string | null
  aiChangeSummary?: string | null
  archivedAt?: string | null
  deletedAt?: string | null
  deletionReason?: string | null
  /** @deprecated use topics.length instead */
  topicsCount: number
  topics: string[]
  documentTopics?: DocumentTopic[]
  chunks: DocumentChunk[]
  linkedTests: LinkedTest[]
  versions: DocumentVersion[]
}
