export type DashboardDocumentStatus = "ready" | "processing" | "failed"
export type DashboardDocumentDisplayStatus =
  | DashboardDocumentStatus
  | "uploaded"
  | "archived"
  | "deleted"
export type DashboardTestStatus = "active" | "draft" | "archived"
export type DashboardActivityType =
  | "document_processed"
  | "test_published"
  | "employee_completed"
  | "weak_topic_detected"

export type DashboardKpiId =
  | "documents"
  | "activeTests"
  | "assignedTests"
  | "activeEmployees"
  | "averageScore"
  | "weakTopics"

export type AnalyticsOverviewKpiId =
  | "teamAverageScore"
  | "completionRate"
  | "completedAttempts"
  | "weakTopics"
  | "difficultQuestions"
  | "failedAttempts"

export interface KpiStat {
  id: DashboardKpiId | AnalyticsOverviewKpiId | string
  value: string
  descriptionParams?: Record<string, string | number>
  useEmptyDescription?: boolean
}

export interface DashboardDocument {
  id: string
  title: string
  status: DashboardDocumentStatus
  displayStatus?: DashboardDocumentDisplayStatus
  topics: string[]
  testCount: number
  updatedAt: string
}

export interface DashboardTest {
  id: string
  title: string
  role: string
  assignedCount: number
  completedCount: number
  averageScore: number
  status: DashboardTestStatus
}

export interface DashboardAiDraft {
  id: string
  title: string
  questionCount: number
  documentId?: string
  status?: string
  model?: string | null
  createdAt?: string
  actionHref?: string
  actionLabel?: string
}

export interface WeeklyCompletion {
  day: string
  completions: number
}

export interface DashboardWeakTopic {
  id: string
  topic: string
  averageCorrectness: number
  relatedDocument: string
  relatedTest: string
}

export interface DashboardActivity {
  id: string
  type: DashboardActivityType
  description: string
  actor: string
  timestamp: string
}
