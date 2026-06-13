import type { MockDocumentDetail } from "@/data/mock/documents"

import type { QuestionType } from "@/features/tests/schemas/generated-test-schema"

export type ReviewStatus = "needs_review" | "approved" | "rejected" | "edited"
export type ReviewDifficulty = "easy" | "medium" | "hard"
export type ReviewLanguage = "English" | "German"

export interface ReviewQuestion {
  id: string
  dbQuestionId?: string
  clientId?: string
  questionText: string
  questionType: QuestionType
  options: string[]
  correctAnswer: string
  /** When multiple options are correct (e.g. AI multiple_choice). */
  correctAnswers?: string[]
  /** Expected answer text for open-ended questions. */
  expectedAnswer?: string
  explanation: string
  topic: string
  sourceChunkReference: string
  sourceChunkId?: string | null
  sourceDocumentTitle?: string
  testedSkill: string
  pedagogicalGoal: string
  difficulty: ReviewDifficulty
  whyUseful: string
  status: ReviewStatus
  isAiGenerated: boolean
}

export interface MockTestReviewData {
  testTitle: string
  description?: string
  difficulty: ReviewDifficulty
  targetRole: string
  questionCount: number
  language: ReviewLanguage
  passingScore: number
  selectedChunksCount: number
  selectedTopics: string[]
  sourceDocuments?: Array<{ id: string; title: string }>
  questions: ReviewQuestion[]
}

const mockReviewByDocumentId: Record<string, MockTestReviewData> = {
  // doc-1: Security Guidelines
  // Chunks: Password Policy (c1), Data Classification (c2), Access Control (c3), Phishing & Social Engineering (c4)
  "doc-1": {
    testTitle: "Security Guidelines Knowledge Test",
    difficulty: "medium",
    targetRole: "All employees",
    questionCount: 8,
    language: "English",
    passingScore: 70,
    selectedChunksCount: 4,
    selectedTopics: [
      "Password Policy",
      "Data Classification",
      "Access Control",
      "Phishing & Social Engineering",
    ],
    questions: [
      {
        id: "doc-1-q1",
        questionText: "What is the minimum password length required for employee accounts?",
        options: ["8 characters", "10 characters", "12 characters", "16 characters"],
        correctAnswer: "12 characters",
        explanation:
          "The password policy requires at least 12 characters including uppercase, lowercase, numbers, and symbols.",
        topic: "Password Policy",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Policy recall",
        pedagogicalGoal: "Confirm employees know minimum password requirements",
        difficulty: "easy",
        whyUseful: "Reduces account compromise risk through enforceable password standards.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-1-q2",
        questionText:
          "Multi-factor authentication (MFA) is required for all systems handling company data.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation:
          "The password policy states MFA is required for all systems handling company data.",
        topic: "Password Policy",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Security requirement recall",
        pedagogicalGoal: "Verify awareness of MFA obligations",
        difficulty: "easy",
        whyUseful: "Ensures employees understand MFA is mandatory, not optional.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-1-q3",
        questionText:
          "How should customer personally identifiable information (PII) be classified?",
        options: ["Public", "Internal", "Confidential", "Restricted"],
        correctAnswer: "Confidential",
        explanation:
          "Customer PII must always be treated as Confidential and stored only in approved systems.",
        topic: "Data Classification",
        sourceChunkReference: "Chunk 2 (doc-1-c2)",
        testedSkill: "Classification understanding",
        pedagogicalGoal: "Ensure correct handling of sensitive customer data",
        difficulty: "medium",
        whyUseful:
          "Prevents mishandling of customer data that could lead to compliance violations.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "approved",
      },
      {
        id: "doc-1-q4",
        questionText: "Which principle governs access to systems and data at the company?",
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
        difficulty: "easy",
        whyUseful: "Limits blast radius if credentials are compromised.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-1-q5",
        questionText: "How often must access permissions be reviewed?",
        options: ["Monthly", "Quarterly", "Annually", "Only on role change"],
        correctAnswer: "Quarterly",
        explanation:
          "Access requests must be approved by the manager and permissions are reviewed quarterly.",
        topic: "Access Control",
        sourceChunkReference: "Chunk 3 (doc-1-c3)",
        testedSkill: "Compliance timing",
        pedagogicalGoal: "Ensure awareness of access review cadence",
        difficulty: "medium",
        whyUseful: "Keeps access permissions aligned with current roles and responsibilities.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-1-q6",
        questionText: "What should you do when you receive a suspicious email?",
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
        difficulty: "easy",
        whyUseful: "Reduces successful phishing attacks through timely reporting.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-1-q7",
        questionText: "Will the security team ever ask for your password via email?",
        options: [
          "Yes, for account verification",
          "Yes, during password resets",
          "No, security will never ask for passwords via email",
          "Only for admin accounts",
        ],
        correctAnswer: "No, security will never ask for passwords via email",
        explanation:
          "Security will never ask for your password via email. Such requests are always phishing attempts.",
        topic: "Phishing & Social Engineering",
        sourceChunkReference: "Chunk 4 (doc-1-c4)",
        testedSkill: "Social engineering awareness",
        pedagogicalGoal: "Prevent credential theft via phishing",
        difficulty: "medium",
        whyUseful: "Closes a common social engineering attack vector.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "rejected",
      },
      {
        id: "doc-1-q8",
        questionText:
          "Which data classification level applies to general internal company announcements?",
        options: ["Public", "Internal", "Confidential", "Restricted"],
        correctAnswer: "Internal",
        explanation:
          "Internal announcements are classified as Internal — available to employees but not shared externally.",
        topic: "Data Classification",
        sourceChunkReference: "Chunk 2 (doc-1-c2)",
        testedSkill: "Classification application",
        pedagogicalGoal: "Test ability to classify common data types",
        difficulty: "medium",
        whyUseful: "Helps employees apply classification consistently in daily work.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "approved",
      },
    ],
  },
  // doc-2: Safety & Compliance Training Manual
  // Chunks: Workplace Hazards (c1), Emergency Procedures (c2), Incident Reporting (c3)
  "doc-2": {
    testTitle: "Safety & Compliance Training Test",
    difficulty: "medium",
    targetRole: "Operations staff",
    questionCount: 5,
    language: "English",
    passingScore: 75,
    selectedChunksCount: 3,
    selectedTopics: ["Workplace Hazards", "Emergency Procedures", "Incident Reporting"],
    questions: [
      {
        id: "doc-2-q1",
        questionText: "When should potential hazards be reported to the safety officer?",
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
        difficulty: "easy",
        whyUseful: "Promotes a proactive safety culture and faster risk mitigation.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-2-q2",
        questionText: "Where are emergency assembly points located for Building B?",
        options: ["Main parking lot", "North loading dock", "East garden", "Reception lobby"],
        correctAnswer: "East garden",
        explanation:
          "The emergency procedures section states Building B assembly location is the east garden.",
        topic: "Emergency Procedures",
        sourceChunkReference: "Chunk 2 (doc-2-c2)",
        testedSkill: "Emergency protocol recall",
        pedagogicalGoal: "Ensure operational readiness for evacuation scenarios",
        difficulty: "easy",
        whyUseful: "Validates critical safety knowledge needed in urgent situations.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "approved",
      },
      {
        id: "doc-2-q3",
        questionText: "What is the deadline for documenting workplace incidents?",
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
        difficulty: "medium",
        whyUseful: "Supports legal and internal compliance consistency.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "needs_review",
      },
      {
        id: "doc-2-q4",
        questionText:
          "Which statement best reflects incident reporting expectations in this manual?",
        options: [
          "Only severe incidents require reports",
          "Only incidents with injuries require reports",
          "All incidents must be reported regardless of severity",
          "Reports are optional if resolved immediately",
        ],
        correctAnswer: "All incidents must be reported regardless of severity",
        explanation:
          "The manual explicitly states every workplace incident must be documented regardless of severity.",
        topic: "Incident Reporting",
        sourceChunkReference: "Chunk 3 (doc-2-c3)",
        testedSkill: "Policy interpretation",
        pedagogicalGoal: "Prevent selective underreporting behavior",
        difficulty: "medium",
        whyUseful: "Improves data quality for workplace safety analytics.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "edited",
      },
      {
        id: "doc-2-q5",
        questionText: "When should the hazard identification walkthrough be completed?",
        options: [
          "During the first week",
          "During the first month",
          "Before annual recertification",
          "Only after the probation period",
        ],
        correctAnswer: "During the first week",
        explanation:
          "The document requires hazard identification walkthrough completion in the first week.",
        topic: "Workplace Hazards",
        sourceChunkReference: "Chunk 1 (doc-2-c1)",
        testedSkill: "Onboarding safety workflow",
        pedagogicalGoal: "Verify operational onboarding safety compliance",
        difficulty: "easy",
        whyUseful: "Confirms essential safety onboarding steps are retained.",
        questionType: "single_choice",

        isAiGenerated: true,

        status: "rejected",
      },
    ],
  },
}

function countSelectedChunks(document: MockDocumentDetail, selectedTopics: string[]): number {
  if (selectedTopics.length === 0) return 0
  return document.chunks.filter((chunk) => selectedTopics.includes(chunk.topic)).length
}

function buildFallbackReviewData(document: MockDocumentDetail): MockTestReviewData {
  const selectedTopics = document.topics.slice(0, Math.min(document.topics.length, 3))
  const fallbackQuestions: ReviewQuestion[] = document.chunks.slice(0, 3).map((chunk, index) => ({
    id: `${document.id}-fallback-q${index + 1}`,
    questionText: `What is the key idea described in the ${chunk.topic} section?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option A",
    explanation:
      "This fallback question exists to keep the review flow clickable when a document has no dedicated mock set.",
    topic: chunk.topic,
    sourceChunkReference: `Chunk ${chunk.chunkIndex + 1} (${chunk.id})`,
    testedSkill: "Topic comprehension",
    pedagogicalGoal: "Verify understanding of source content",
    difficulty: "medium",
    whyUseful: "Preserves continuity in the mock review flow across documents.",
    questionType: "single_choice",

    isAiGenerated: true,

    status: "needs_review",
  }))

  return {
    testTitle: `${document.title} Knowledge Test`,
    difficulty: "medium",
    targetRole: "All employees",
    questionCount: fallbackQuestions.length,
    language: "English",
    passingScore: 80,
    selectedChunksCount: countSelectedChunks(document, selectedTopics),
    selectedTopics,
    questions: fallbackQuestions,
  }
}

export function getMockTestReviewData(document: MockDocumentDetail): MockTestReviewData {
  return mockReviewByDocumentId[document.id] ?? buildFallbackReviewData(document)
}
