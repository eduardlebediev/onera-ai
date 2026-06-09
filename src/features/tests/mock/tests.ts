export type TestStatus = "draft" | "published" | "archived"
export type TestDifficulty = "easy" | "medium" | "hard"
export type TestLanguage = "English" | "German"
export type TestQuestionType = "single_choice" | "multiple_choice" | "true_false"

export interface TestQuestion {
  id: string
  questionText: string
  type: TestQuestionType
  options: string[]
  correctAnswer: string
  explanation: string
  topic: string
  testedSkill: string
  pedagogicalGoal: string
  sourceChunkReference: string
}

export interface TestSourceDocumentRef {
  documentId: string
  topicsUsed: string[]
  chunksUsed: number
}

export interface TestAssignmentsSummary {
  assigned: number
  completed: number
  inProgress: number
  notStarted: number
}

export interface TestWeakTopic {
  topic: string
  correctnessPct: number
}

export interface TestRecentAttempt {
  id: string
  employeeName: string
  score: number
  passed: boolean
  completedAt: string
}

export interface TestResultsSummary {
  averageScore: number
  passRate: number
  weakTopics: TestWeakTopic[]
  recentAttempts: TestRecentAttempt[]
}

export interface MockTest {
  id: string
  title: string
  description: string
  status: TestStatus
  difficulty: TestDifficulty
  targetRole: string
  language: TestLanguage
  questionCount: number
  passingScore: number
  selectedTopics: string[]
  selectedChunksCount: number
  createdAt: string
  assignedEmployeesCount: number
  attemptsCount: number
  sourceDocument: TestSourceDocumentRef
  questions: TestQuestion[]
  assignments: TestAssignmentsSummary
  results: TestResultsSummary
}

export const mockTests: MockTest[] = [
  {
    id: "test-1",
    title: "Security Guidelines Knowledge Test",
    description:
      "Assesses understanding of password policy, data classification, access control, and phishing awareness for all employees.",
    status: "published",
    difficulty: "medium",
    targetRole: "All employees",
    language: "English",
    questionCount: 5,
    passingScore: 70,
    selectedTopics: [
      "Password Policy",
      "Data Classification",
      "Access Control",
      "Phishing & Social Engineering",
    ],
    selectedChunksCount: 4,
    createdAt: "2024-05-15",
    assignedEmployeesCount: 8,
    attemptsCount: 9,
    sourceDocument: {
      documentId: "doc-1",
      topicsUsed: [
        "Password Policy",
        "Data Classification",
        "Access Control",
        "Phishing & Social Engineering",
      ],
      chunksUsed: 4,
    },
    questions: [
      {
        id: "test-1-q1",
        questionText: "What is the minimum password length required for employee accounts?",
        type: "single_choice",
        options: ["8 characters", "10 characters", "12 characters", "16 characters"],
        correctAnswer: "12 characters",
        explanation:
          "The password policy requires at least 12 characters including uppercase, lowercase, numbers, and symbols.",
        topic: "Password Policy",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Policy recall",
        pedagogicalGoal: "Confirm employees know minimum password requirements",
      },
      {
        id: "test-1-q2",
        questionText:
          "Multi-factor authentication (MFA) is required for all systems handling company data.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The password policy states MFA is required for all systems handling company data.",
        topic: "Password Policy",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Security requirement recall",
        pedagogicalGoal: "Verify awareness of MFA obligations",
      },
      {
        id: "test-1-q3",
        questionText:
          "How should customer personally identifiable information (PII) be classified?",
        type: "single_choice",
        options: ["Public", "Internal", "Confidential", "Restricted"],
        correctAnswer: "Confidential",
        explanation:
          "Customer PII must always be treated as Confidential and stored only in approved systems.",
        topic: "Data Classification",
        sourceChunkReference: "Chunk 2 (doc-1-c2)",
        testedSkill: "Classification understanding",
        pedagogicalGoal: "Ensure correct handling of sensitive customer data",
      },
      {
        id: "test-1-q4",
        questionText: "Which principle governs access to systems and data at the company?",
        type: "single_choice",
        options: [
          "Maximum availability",
          "Least privilege",
          "Shared credentials",
          "Open access by default",
        ],
        correctAnswer: "Least privilege",
        explanation:
          "Access follows the principle of least privilege — employees receive only permissions necessary for their role.",
        topic: "Access Control",
        sourceChunkReference: "Chunk 3 (doc-1-c3)",
        testedSkill: "Access policy understanding",
        pedagogicalGoal: "Reinforce least-privilege access expectations",
      },
      {
        id: "test-1-q5",
        questionText: "What should you do when you receive a suspicious email?",
        type: "single_choice",
        options: [
          "Click the link to verify the sender",
          "Forward it to colleagues for a second opinion",
          "Report it using the Report Phishing button",
          "Reply asking the sender to confirm their identity",
        ],
        correctAnswer: "Report it using the Report Phishing button",
        explanation:
          "Employees must report suspicious emails immediately using the Report Phishing button. Never click links from unknown senders.",
        topic: "Phishing & Social Engineering",
        sourceChunkReference: "Chunk 4 (doc-1-c4)",
        testedSkill: "Incident response behavior",
        pedagogicalGoal: "Promote correct phishing reporting behavior",
      },
    ],
    assignments: {
      assigned: 8,
      completed: 3,
      inProgress: 2,
      notStarted: 2,
    },
    results: {
      averageScore: 76,
      passRate: 78,
      weakTopics: [
        { topic: "Phishing & Social Engineering", correctnessPct: 58 },
        { topic: "Access Control", correctnessPct: 65 },
      ],
      recentAttempts: [
        {
          id: "attempt-1",
          employeeName: "Sarah Chen",
          score: 80,
          passed: true,
          completedAt: "2024-06-12",
        },
        {
          id: "attempt-2",
          employeeName: "Marcus Webb",
          score: 60,
          passed: false,
          completedAt: "2024-06-10",
        },
        {
          id: "attempt-3",
          employeeName: "Elena Rodriguez",
          score: 100,
          passed: true,
          completedAt: "2024-06-08",
        },
      ],
    },
  },
  {
    id: "test-2",
    title: "Safety & Compliance Assessment",
    description:
      "Mandatory safety knowledge check covering workplace hazards, emergency procedures, and incident reporting.",
    status: "published",
    difficulty: "medium",
    targetRole: "Operations staff",
    language: "English",
    questionCount: 4,
    passingScore: 75,
    selectedTopics: ["Workplace Hazards", "Emergency Procedures", "Incident Reporting"],
    selectedChunksCount: 3,
    createdAt: "2024-06-05",
    assignedEmployeesCount: 8,
    attemptsCount: 6,
    sourceDocument: {
      documentId: "doc-2",
      topicsUsed: ["Workplace Hazards", "Emergency Procedures", "Incident Reporting"],
      chunksUsed: 3,
    },
    questions: [
      {
        id: "test-2-q1",
        questionText: "When should potential hazards be reported to the safety officer?",
        type: "single_choice",
        options: [
          "At the end of each month",
          "Only after manager approval",
          "Immediately after identification",
          "During annual safety audit",
        ],
        correctAnswer: "Immediately after identification",
        explanation:
          "The manual states all identified hazards must be reported to the safety officer immediately.",
        topic: "Workplace Hazards",
        sourceChunkReference: "Chunk 1 (doc-2-c1)",
        testedSkill: "Hazard-response timing",
        pedagogicalGoal: "Reinforce timely hazard reporting behavior",
      },
      {
        id: "test-2-q2",
        questionText: "Where are emergency assembly points located for Building B?",
        type: "single_choice",
        options: ["Main parking lot", "North loading dock", "East garden", "Reception lobby"],
        correctAnswer: "East garden",
        explanation:
          "The emergency procedures section states Building B assembly location is the east garden.",
        topic: "Emergency Procedures",
        sourceChunkReference: "Chunk 2 (doc-2-c2)",
        testedSkill: "Emergency protocol recall",
        pedagogicalGoal: "Ensure operational readiness for evacuation scenarios",
      },
      {
        id: "test-2-q3",
        questionText: "What is the deadline for documenting workplace incidents?",
        type: "single_choice",
        options: [
          "Within 12 hours",
          "Within 24 hours",
          "Within 48 hours",
          "Within 5 business days",
        ],
        correctAnswer: "Within 24 hours",
        explanation:
          "The incident reporting section requires documentation of any incident within 24 hours.",
        topic: "Incident Reporting",
        sourceChunkReference: "Chunk 3 (doc-2-c3)",
        testedSkill: "Compliance deadline recall",
        pedagogicalGoal: "Check understanding of reporting obligations",
      },
      {
        id: "test-2-q4",
        questionText: "All workplace incidents must be reported regardless of severity.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The manual explicitly states every workplace incident must be documented regardless of severity.",
        topic: "Incident Reporting",
        sourceChunkReference: "Chunk 3 (doc-2-c3)",
        testedSkill: "Policy interpretation",
        pedagogicalGoal: "Prevent selective underreporting behavior",
      },
    ],
    assignments: {
      assigned: 8,
      completed: 3,
      inProgress: 2,
      notStarted: 3,
    },
    results: {
      averageScore: 82,
      passRate: 83,
      weakTopics: [{ topic: "Emergency Procedures", correctnessPct: 62 }],
      recentAttempts: [
        {
          id: "attempt-4",
          employeeName: "James Okonkwo",
          score: 75,
          passed: true,
          completedAt: "2024-06-14",
        },
        {
          id: "attempt-5",
          employeeName: "Priya Sharma",
          score: 100,
          passed: true,
          completedAt: "2024-06-11",
        },
      ],
    },
  },
  {
    id: "test-3",
    title: "Security Essentials (Draft)",
    description:
      "Draft test focused on password policy and access control basics for all-staff security awareness.",
    status: "draft",
    difficulty: "easy",
    targetRole: "All employees",
    language: "English",
    questionCount: 3,
    passingScore: 65,
    selectedTopics: ["Password Policy", "Access Control"],
    selectedChunksCount: 2,
    createdAt: "2024-06-16",
    assignedEmployeesCount: 0,
    attemptsCount: 0,
    sourceDocument: {
      documentId: "doc-1",
      topicsUsed: ["Password Policy", "Access Control"],
      chunksUsed: 2,
    },
    questions: [
      {
        id: "test-3-q1",
        questionText: "What character types must passwords include per company policy?",
        type: "single_choice",
        options: [
          "Numbers only",
          "Uppercase, lowercase, numbers, and symbols",
          "Letters and numbers only",
          "Any 8-character combination",
        ],
        correctAnswer: "Uppercase, lowercase, numbers, and symbols",
        explanation:
          "Passwords must include uppercase, lowercase, numbers, and symbols with a minimum length of 12 characters.",
        topic: "Password Policy",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Policy detail recall",
        pedagogicalGoal: "Verify password complexity requirements",
      },
      {
        id: "test-3-q2",
        questionText: "How often must access permissions be reviewed?",
        type: "single_choice",
        options: ["Monthly", "Quarterly", "Annually", "Only on role change"],
        correctAnswer: "Quarterly",
        explanation:
          "Access requests must be approved by the manager and permissions are reviewed quarterly.",
        topic: "Access Control",
        sourceChunkReference: "Chunk 3 (doc-1-c3)",
        testedSkill: "Compliance timing",
        pedagogicalGoal: "Ensure awareness of access review cadence",
      },
      {
        id: "test-3-q3",
        questionText: "MFA is required for all systems handling company data.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The password policy states MFA is required for all systems handling company data.",
        topic: "Password Policy",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Security requirement recall",
        pedagogicalGoal: "Verify awareness of MFA obligations",
      },
    ],
    assignments: {
      assigned: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    },
    results: {
      averageScore: 0,
      passRate: 0,
      weakTopics: [],
      recentAttempts: [],
    },
  },
  {
    id: "test-4",
    title: "Support Protocols Test (Draft)",
    description:
      "Draft assessment on SLA definitions, escalation paths, and communication templates for support agents.",
    status: "draft",
    difficulty: "medium",
    targetRole: "Support agents",
    language: "English",
    questionCount: 4,
    passingScore: 70,
    selectedTopics: ["SLA Definitions", "Escalation Paths", "Communication Templates"],
    selectedChunksCount: 3,
    createdAt: "2024-06-17",
    assignedEmployeesCount: 0,
    attemptsCount: 0,
    sourceDocument: {
      documentId: "doc-4",
      topicsUsed: ["SLA Definitions", "Escalation Paths", "Communication Templates"],
      chunksUsed: 3,
    },
    questions: [
      {
        id: "test-4-q1",
        questionText: "What is the initial response SLA for Tier-1 issues?",
        type: "single_choice",
        options: [
          "Within 1 business hour",
          "Within 2 business hours",
          "Within 24 hours",
          "Within 48 hours",
        ],
        correctAnswer: "Within 2 business hours",
        explanation:
          "The playbook states Tier-1 issues must receive an initial response within 2 business hours.",
        topic: "SLA Definitions",
        sourceChunkReference: "Chunk 1 (doc-4-c1)",
        testedSkill: "SLA recall",
        pedagogicalGoal: "Ensure agents know Tier-1 response expectations",
      },
      {
        id: "test-4-q2",
        questionText: "Critical production outages are classified as P0 incidents.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The SLA section classifies critical production outages as P0 and requires immediate acknowledgment.",
        topic: "SLA Definitions",
        sourceChunkReference: "Chunk 1 (doc-4-c1)",
        testedSkill: "Incident classification",
        pedagogicalGoal: "Verify understanding of priority levels",
      },
      {
        id: "test-4-q3",
        questionText:
          "When must a ticket be escalated to the senior support lead if it remains unresolved?",
        type: "single_choice",
        options: ["After 24 hours", "After 48 hours", "After 72 hours", "After one week"],
        correctAnswer: "After 48 hours",
        explanation:
          "The escalation section states tickets unresolved after 48 hours must be escalated to the senior support lead.",
        topic: "Escalation Paths",
        sourceChunkReference: "Chunk 2 (doc-4-c2)",
        testedSkill: "Escalation timing",
        pedagogicalGoal: "Reinforce escalation deadlines for unresolved tickets",
      },
      {
        id: "test-4-q4",
        questionText:
          "Custom customer responses for Enterprise-tier accounts require team lead review before sending.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "Communication templates require team lead review for custom responses on Enterprise-tier accounts.",
        topic: "Communication Templates",
        sourceChunkReference: "Chunk 3 (doc-4-c3)",
        testedSkill: "Communication policy",
        pedagogicalGoal: "Ensure compliance with approved template requirements",
      },
    ],
    assignments: {
      assigned: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    },
    results: {
      averageScore: 0,
      passRate: 0,
      weakTopics: [],
      recentAttempts: [],
    },
  },
  {
    id: "test-5",
    title: "Support Protocols Test (2023)",
    description:
      "Archived version of the support protocols assessment, replaced by an updated playbook edition.",
    status: "archived",
    difficulty: "medium",
    targetRole: "Support agents",
    language: "English",
    questionCount: 3,
    passingScore: 70,
    selectedTopics: ["SLA Definitions", "Escalation Paths"],
    selectedChunksCount: 2,
    createdAt: "2024-03-15",
    assignedEmployeesCount: 6,
    attemptsCount: 6,
    sourceDocument: {
      documentId: "doc-4",
      topicsUsed: ["SLA Definitions", "Escalation Paths"],
      chunksUsed: 2,
    },
    questions: [
      {
        id: "test-5-q1",
        questionText: "What is the response SLA for Tier-2 issues?",
        type: "single_choice",
        options: [
          "Within 2 business hours",
          "Within 12 hours",
          "Within 24 hours",
          "Within 48 hours",
        ],
        correctAnswer: "Within 24 hours",
        explanation: "The playbook defines a 24-hour response SLA for Tier-2 issues.",
        topic: "SLA Definitions",
        sourceChunkReference: "Chunk 1 (doc-4-c1)",
        testedSkill: "SLA recall",
        pedagogicalGoal: "Verify Tier-2 response expectations",
      },
      {
        id: "test-5-q2",
        questionText: "P0 issues bypass standard escalation and go directly to the on-call lead.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The escalation section states P0 issues bypass standard escalation and go directly to the on-call engineering lead.",
        topic: "Escalation Paths",
        sourceChunkReference: "Chunk 2 (doc-4-c2)",
        testedSkill: "Escalation routing",
        pedagogicalGoal: "Ensure agents know P0 escalation paths",
      },
      {
        id: "test-5-q3",
        questionText: "Which response time applies to Tier-1 issues under the current playbook?",
        type: "single_choice",
        options: [
          "Within 1 business hour",
          "Within 2 business hours",
          "Within 24 hours",
          "Immediate acknowledgment only",
        ],
        correctAnswer: "Within 2 business hours",
        explanation: "Tier-1 issues require an initial response within 2 business hours.",
        topic: "SLA Definitions",
        sourceChunkReference: "Chunk 1 (doc-4-c1)",
        testedSkill: "SLA recall",
        pedagogicalGoal: "Differentiate Tier-1 from Tier-2 SLAs",
      },
    ],
    assignments: {
      assigned: 6,
      completed: 6,
      inProgress: 0,
      notStarted: 0,
    },
    results: {
      averageScore: 71,
      passRate: 67,
      weakTopics: [{ topic: "Escalation Paths", correctnessPct: 55 }],
      recentAttempts: [
        {
          id: "attempt-6",
          employeeName: "Alex Turner",
          score: 67,
          passed: false,
          completedAt: "2024-04-18",
        },
        {
          id: "attempt-7",
          employeeName: "Nina Patel",
          score: 100,
          passed: true,
          completedAt: "2024-04-12",
        },
      ],
    },
  },
]

export function getMockTestById(id: string): MockTest | undefined {
  return mockTests.find((test) => test.id === id)
}
