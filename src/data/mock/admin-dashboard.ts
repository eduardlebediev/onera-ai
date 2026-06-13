export type DocumentStatus = "ready" | "processing" | "failed"
export type DocumentDisplayStatus = DocumentStatus | "uploaded" | "archived" | "deleted"
export type TestStatus = "active" | "draft" | "archived"
export type ActivityType =
  | "document_processed"
  | "test_published"
  | "employee_completed"
  | "weak_topic_detected"

export interface KpiStat {
  label: string
  value: string
  description: string
}

export interface MockDocument {
  id: string
  title: string
  status: DocumentStatus
  displayStatus?: DocumentDisplayStatus
  topics: string[]
  testCount: number
  updatedAt: string
}

export interface MockTest {
  id: string
  title: string
  role: string
  assignedCount: number
  completedCount: number
  averageScore: number
  status: TestStatus
}

export interface MockAiDraft {
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

export interface MockWeakTopic {
  id: string
  topic: string
  averageCorrectness: number
  relatedDocument: string
  relatedTest: string
}

export interface MockActivity {
  id: string
  type: ActivityType
  description: string
  actor: string
  timestamp: string
}

export const kpiStats: KpiStat[] = [
  {
    label: "Documents",
    value: "24",
    description: "18 ready · 4 processing · 2 failed",
  },
  {
    label: "Active Tests",
    value: "8",
    description: "Currently published",
  },
  {
    label: "Assigned Tests",
    value: "47",
    description: "Across all employees",
  },
  {
    label: "Active Employees",
    value: "16",
    description: "Completed a test in the last 7 days",
  },
  {
    label: "Average Score",
    value: "73%",
    description: "6% vs. last week",
  },
  {
    label: "Weak Topics",
    value: "5",
    description: "Phishing, Access Control, Escalation",
  },
]

export const recentDocuments: MockDocument[] = [
  {
    id: "doc-1",
    title: "Security Guidelines",
    status: "ready",
    topics: ["Password Policy", "Data Classification", "Access Control", "Phishing"],
    testCount: 2,
    updatedAt: "Today",
  },
  {
    id: "doc-2",
    title: "Safety & Compliance Training Manual",
    status: "ready",
    topics: ["Workplace Hazards", "Emergency Procedures", "Incident Reporting"],
    testCount: 1,
    updatedAt: "Yesterday",
  },
  {
    id: "doc-3",
    title: "Product Architecture & Engineering Standards",
    status: "processing",
    topics: [],
    testCount: 0,
    updatedAt: "Today",
  },
  {
    id: "doc-4",
    title: "Customer Support Playbook",
    status: "ready",
    displayStatus: "uploaded",
    topics: ["SLA Definitions", "Escalation Paths"],
    testCount: 2,
    updatedAt: "2 days ago",
  },
  {
    id: "doc-5",
    title: "Data Privacy & GDPR Guidelines",
    status: "failed",
    topics: [],
    testCount: 0,
    updatedAt: "3 days ago",
  },
]

export const testPerformance: MockTest[] = [
  {
    id: "test-1",
    title: "Security Guidelines Knowledge Test",
    role: "All",
    assignedCount: 18,
    completedCount: 14,
    averageScore: 76,
    status: "active",
  },
  {
    id: "test-2",
    title: "Safety & Compliance Assessment",
    role: "Operations",
    assignedCount: 8,
    completedCount: 5,
    averageScore: 82,
    status: "active",
  },
  {
    id: "test-3",
    title: "Security Essentials (Draft)",
    role: "All",
    assignedCount: 0,
    completedCount: 0,
    averageScore: 0,
    status: "draft",
  },
]

export const aiDrafts: MockAiDraft[] = [
  { id: "draft-1", title: "Security Guidelines Knowledge Test", questionCount: 8 },
  { id: "draft-2", title: "Security Essentials (Draft)", questionCount: 3 },
  { id: "draft-3", title: "Support Protocols Test", questionCount: 4 },
]

export const weeklyCompletions: WeeklyCompletion[] = [
  { day: "Mon", completions: 24 },
  { day: "Tue", completions: 36 },
  { day: "Wed", completions: 42 },
  { day: "Thu", completions: 58 },
  { day: "Fri", completions: 55 },
  { day: "Sat", completions: 63 },
  { day: "Sun", completions: 72 },
]

export const weakTopics: MockWeakTopic[] = [
  {
    id: "wt-1",
    topic: "Phishing & Social Engineering",
    averageCorrectness: 58,
    relatedDocument: "Security Guidelines",
    relatedTest: "Security Guidelines Knowledge Test",
  },
  {
    id: "wt-2",
    topic: "Access Control",
    averageCorrectness: 65,
    relatedDocument: "Security Guidelines",
    relatedTest: "Security Guidelines Knowledge Test",
  },
  {
    id: "wt-3",
    topic: "Emergency Procedures",
    averageCorrectness: 62,
    relatedDocument: "Safety & Compliance Training Manual",
    relatedTest: "Safety & Compliance Assessment",
  },
  {
    id: "wt-4",
    topic: "Incident Reporting Timelines",
    averageCorrectness: 55,
    relatedDocument: "Safety & Compliance Training Manual",
    relatedTest: "Safety & Compliance Assessment",
  },
  {
    id: "wt-5",
    topic: "Escalation Paths",
    averageCorrectness: 58,
    relatedDocument: "Customer Support Playbook",
    relatedTest: "Support Protocols Test",
  },
]

export const recentActivity: MockActivity[] = [
  {
    id: "act-1",
    type: "weak_topic_detected",
    description: "Weak topic detected: Phishing & Social Engineering (58% avg)",
    actor: "System",
    timestamp: "10 minutes ago",
  },
  {
    id: "act-2",
    type: "employee_completed",
    description: "Alex T. completed Security Guidelines Knowledge Test — scored 80%",
    actor: "Alex T.",
    timestamp: "1 hour ago",
  },
  {
    id: "act-3",
    type: "document_processed",
    description: "Security Guidelines finished processing — 4 topics extracted",
    actor: "System",
    timestamp: "2 hours ago",
  },
  {
    id: "act-4",
    type: "employee_completed",
    description: "Priya S. completed Safety & Compliance Assessment — scored 100%",
    actor: "Priya S.",
    timestamp: "4 hours ago",
  },
  {
    id: "act-5",
    type: "test_published",
    description: "Security Guidelines Knowledge Test published and assigned to 8 employees",
    actor: "Admin",
    timestamp: "Yesterday",
  },
  {
    id: "act-6",
    type: "document_processed",
    description: "Safety & Compliance Training Manual finished processing — 5 topics extracted",
    actor: "System",
    timestamp: "1 day ago",
  },
]
