export type DocumentStatus = "ready" | "processing" | "failed"
export type DocumentDisplayStatus = DocumentStatus | "uploaded"
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
  quizCount: number
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
    description: "Access, Security, Deployment",
  },
]

export const recentDocuments: MockDocument[] = [
  {
    id: "doc-1",
    title: "Security Guidelines",
    status: "ready",
    topics: ["Security", "Access", "Policies", "Compliance"],
    quizCount: 3,
    updatedAt: "Today",
  },
  {
    id: "doc-2",
    title: "Code Review Policy",
    status: "ready",
    topics: ["Code", "Quality", "Standards"],
    quizCount: 1,
    updatedAt: "Yesterday",
  },
  {
    id: "doc-3",
    title: "Deployment SOP",
    status: "processing",
    topics: [],
    quizCount: 0,
    updatedAt: "Today",
  },
  {
    id: "doc-4",
    title: "Incident Management",
    status: "ready",
    displayStatus: "uploaded",
    topics: [],
    quizCount: 0,
    updatedAt: "2 days ago",
  },
  {
    id: "doc-5",
    title: "Privacy Policy",
    status: "failed",
    topics: [],
    quizCount: 0,
    updatedAt: "3 days ago",
  },
]

export const testPerformance: MockTest[] = [
  {
    id: "test-1",
    title: "Security Basics",
    role: "All",
    assignedCount: 18,
    completedCount: 14,
    averageScore: 82,
    status: "active",
  },
  {
    id: "test-2",
    title: "Code Review Process",
    role: "Developer",
    assignedCount: 8,
    completedCount: 5,
    averageScore: 74,
    status: "active",
  },
  {
    id: "test-3",
    title: "Support Escalation",
    role: "Support",
    assignedCount: 12,
    completedCount: 9,
    averageScore: 69,
    status: "active",
  },
]

export const aiDrafts: MockAiDraft[] = [
  { id: "draft-1", title: "Security Advanced", questionCount: 10 },
  { id: "draft-2", title: "Deployment Basics", questionCount: 8 },
  { id: "draft-3", title: "Support Rules", questionCount: 12 },
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
    topic: "Emergency Evacuation Procedures",
    averageCorrectness: 38,
    relatedDocument: "Q1 Safety Protocol Manual",
    relatedTest: "Safety Protocol Assessment",
  },
  {
    id: "wt-2",
    topic: "Corrective Action Reports",
    averageCorrectness: 44,
    relatedDocument: "ISO 9001 Quality Standards",
    relatedTest: "ISO Quality Fundamentals",
  },
  {
    id: "wt-3",
    topic: "Chemical PPE Requirements",
    averageCorrectness: 51,
    relatedDocument: "Chemical Handling Procedures",
    relatedTest: "Safety Protocol Assessment",
  },
  {
    id: "wt-4",
    topic: "Incident Reporting Timelines",
    averageCorrectness: 55,
    relatedDocument: "Q1 Safety Protocol Manual",
    relatedTest: "Safety Protocol Assessment",
  },
  {
    id: "wt-5",
    topic: "Probationary Review Process",
    averageCorrectness: 58,
    relatedDocument: "Onboarding Handbook 2024",
    relatedTest: "Onboarding Knowledge Check",
  },
]

export const recentActivity: MockActivity[] = [
  {
    id: "act-1",
    type: "weak_topic_detected",
    description: "Weak topic detected: Emergency Evacuation Procedures (38% avg)",
    actor: "System",
    timestamp: "10 minutes ago",
  },
  {
    id: "act-2",
    type: "employee_completed",
    description: "Maria S. completed Safety Protocol Assessment — scored 72%",
    actor: "Maria S.",
    timestamp: "1 hour ago",
  },
  {
    id: "act-3",
    type: "document_processed",
    description: "Q1 Safety Protocol Manual finished processing — 3 topics extracted",
    actor: "System",
    timestamp: "2 hours ago",
  },
  {
    id: "act-4",
    type: "employee_completed",
    description: "James R. completed Onboarding Knowledge Check — scored 95%",
    actor: "James R.",
    timestamp: "4 hours ago",
  },
  {
    id: "act-5",
    type: "test_published",
    description: "ISO Quality Fundamentals published and assigned to 8 employees",
    actor: "Admin",
    timestamp: "Yesterday",
  },
  {
    id: "act-6",
    type: "document_processed",
    description: "Onboarding Handbook 2024 finished processing — 3 topics extracted",
    actor: "System",
    timestamp: "1 day ago",
  },
]
