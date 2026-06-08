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
    title: "HR Policies Knowledge Test",
    description:
      "Assesses understanding of onboarding steps, code of conduct, benefits, and leave policies for new employees.",
    status: "published",
    difficulty: "medium",
    targetRole: "New employees",
    language: "English",
    questionCount: 5,
    passingScore: 70,
    selectedTopics: [
      "Onboarding Steps",
      "Code of Conduct",
      "Benefits & Compensation",
      "Leave Policies",
    ],
    selectedChunksCount: 4,
    createdAt: "2024-05-15",
    assignedEmployeesCount: 12,
    attemptsCount: 9,
    sourceDocument: {
      documentId: "doc-1",
      topicsUsed: [
        "Onboarding Steps",
        "Code of Conduct",
        "Benefits & Compensation",
        "Leave Policies",
      ],
      chunksUsed: 4,
    },
    questions: [
      {
        id: "test-1-q1",
        questionText: "On which day does the onboarding process officially begin?",
        type: "single_choice",
        options: [
          "The day before the start date with a welcome call",
          "Day 1 with an orientation session covering company history and team introductions",
          "Day 3 after completing tool access setup",
          "During the first performance review at end of month one",
        ],
        correctAnswer:
          "Day 1 with an orientation session covering company history and team introductions",
        explanation:
          "The onboarding document states the process begins on Day 1 with an orientation covering company history, mission, and team introductions.",
        topic: "Onboarding Steps",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Process recall",
        pedagogicalGoal: "Confirm employees know when the formal onboarding period starts",
      },
      {
        id: "test-1-q2",
        questionText:
          "Within how many hours should a new employee receive access to all relevant tools?",
        type: "single_choice",
        options: ["24 hours", "48 hours", "72 hours", "One week"],
        correctAnswer: "48 hours",
        explanation:
          "The onboarding policy states that new employees receive access to all relevant tools within the first 48 hours.",
        topic: "Onboarding Steps",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Policy detail recall",
        pedagogicalGoal: "Verify awareness of tool-access deadline for onboarding coordinators",
      },
      {
        id: "test-1-q3",
        questionText:
          "According to the Code of Conduct, what behavior is expected from all employees?",
        type: "single_choice",
        options: [
          "Achieving individual targets above team collaboration",
          "Acting with integrity, respect, and professionalism",
          "Reporting only critical violations to management",
          "Following company policy only when working on-site",
        ],
        correctAnswer: "Acting with integrity, respect, and professionalism",
        explanation:
          "The Code of Conduct states all employees are expected to act with integrity, respect, and professionalism at all times.",
        topic: "Code of Conduct",
        sourceChunkReference: "Chunk 2 (doc-1-c2)",
        testedSkill: "Policy understanding",
        pedagogicalGoal: "Reinforce the core behavioral expectation defined in the Code of Conduct",
      },
      {
        id: "test-1-q4",
        questionText:
          "From which day are employees eligible for health, dental, and vision insurance?",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The benefits section states employees are eligible for health, dental, and vision insurance from the first day of employment.",
        topic: "Benefits & Compensation",
        sourceChunkReference: "Chunk 3 (doc-1-c3)",
        testedSkill: "Benefits eligibility recall",
        pedagogicalGoal: "Confirm employees know their insurance entitlement start date",
      },
      {
        id: "test-1-q5",
        questionText: "Which statement correctly describes sick leave under this policy?",
        type: "single_choice",
        options: [
          "Sick leave is included in the annual vacation allowance",
          "Sick leave is separate and not capped",
          "Sick leave is capped at 10 days annually",
          "Sick leave requires manager approval for every absence",
        ],
        correctAnswer: "Sick leave is separate and not capped",
        explanation:
          "The leave policies section states sick leave is separate from paid vacation and has no annual cap.",
        topic: "Leave Policies",
        sourceChunkReference: "Chunk 4 (doc-1-c4)",
        testedSkill: "Policy distinction",
        pedagogicalGoal: "Differentiate leave categories accurately",
      },
    ],
    assignments: {
      assigned: 12,
      completed: 7,
      inProgress: 3,
      notStarted: 2,
    },
    results: {
      averageScore: 76,
      passRate: 78,
      weakTopics: [
        { topic: "Leave Policies", correctnessPct: 58 },
        { topic: "Benefits & Compensation", correctnessPct: 65 },
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
      completed: 5,
      inProgress: 2,
      notStarted: 1,
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
    title: "Onboarding Essentials (Draft)",
    description:
      "Draft test focused on Day 1 onboarding steps and code of conduct for new hire orientation.",
    status: "draft",
    difficulty: "easy",
    targetRole: "New employees",
    language: "English",
    questionCount: 3,
    passingScore: 65,
    selectedTopics: ["Onboarding Steps", "Code of Conduct"],
    selectedChunksCount: 2,
    createdAt: "2024-06-16",
    assignedEmployeesCount: 0,
    attemptsCount: 0,
    sourceDocument: {
      documentId: "doc-1",
      topicsUsed: ["Onboarding Steps", "Code of Conduct"],
      chunksUsed: 2,
    },
    questions: [
      {
        id: "test-3-q1",
        questionText: "What is the correct order of events described in the onboarding process?",
        type: "single_choice",
        options: [
          "Tool access → Orientation → Team introductions",
          "Orientation → Team introductions → Tool access within 48 hours",
          "Team introductions → Tool access → Orientation",
          "Orientation → Tool access after first month → Team introductions",
        ],
        correctAnswer: "Orientation → Team introductions → Tool access within 48 hours",
        explanation:
          "The document outlines orientation and team introductions on Day 1, followed by tool access within the first two days.",
        topic: "Onboarding Steps",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Process sequencing",
        pedagogicalGoal: "Validate understanding of onboarding order and dependencies",
      },
      {
        id: "test-3-q2",
        questionText: "What is the potential consequence of violating the Code of Conduct?",
        type: "single_choice",
        options: [
          "A verbal warning only",
          "Mandatory retraining with no other consequences",
          "Disciplinary action up to and including termination",
          "Temporary suspension of tool access",
        ],
        correctAnswer: "Disciplinary action up to and including termination",
        explanation:
          "The document explicitly states that violations are subject to disciplinary action up to and including termination.",
        topic: "Code of Conduct",
        sourceChunkReference: "Chunk 2 (doc-1-c2)",
        testedSkill: "Risk awareness",
        pedagogicalGoal: "Ensure employees understand the severity of conduct violations",
      },
      {
        id: "test-3-q3",
        questionText:
          "New employees receive access to all relevant tools within the first 48 hours.",
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The onboarding policy states that new employees receive access to all relevant tools within the first 48 hours.",
        topic: "Onboarding Steps",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Policy detail recall",
        pedagogicalGoal: "Verify awareness of tool-access deadline",
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
    title: "Support Protocols Quiz (Draft)",
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
    title: "Support Protocols Quiz (2023)",
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
