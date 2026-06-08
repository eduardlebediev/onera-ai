import type { MockDocumentDetail } from "@/data/mock/documents"

export type ReviewStatus = "needs_review" | "approved" | "rejected" | "edited"
export type ReviewDifficulty = "easy" | "medium" | "hard"
export type ReviewLanguage = "English" | "German"

export interface ReviewQuestion {
  id: string
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
  topic: string
  sourceChunkReference: string
  testedSkill: string
  pedagogicalGoal: string
  difficulty: ReviewDifficulty
  whyUseful: string
  status: ReviewStatus
}

export interface MockTestReviewData {
  testTitle: string
  difficulty: ReviewDifficulty
  targetRole: string
  questionCount: number
  language: ReviewLanguage
  selectedTopics: string[]
  questions: ReviewQuestion[]
}

const mockReviewByDocumentId: Record<string, MockTestReviewData> = {
  // doc-1: Onboarding Process & HR Policies 2024
  // Chunks: Onboarding Steps (c1), Code of Conduct (c2), Benefits & Compensation (c3), Leave Policies (c4)
  "doc-1": {
    testTitle: "Onboarding Process & HR Policies Knowledge Test",
    difficulty: "medium",
    targetRole: "New employees",
    questionCount: 8,
    language: "English",
    selectedTopics: [
      "Onboarding Steps",
      "Code of Conduct",
      "Benefits & Compensation",
      "Leave Policies",
    ],
    questions: [
      {
        id: "doc-1-q1",
        questionText: "On which day does the onboarding process officially begin?",
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
        difficulty: "easy",
        whyUseful:
          "Ensures new hires understand the Day 1 structure so they arrive prepared and confident.",
        status: "needs_review",
      },
      {
        id: "doc-1-q2",
        questionText:
          "Within how many hours should a new employee receive access to all relevant tools?",
        options: ["24 hours", "48 hours", "72 hours", "One week"],
        correctAnswer: "48 hours",
        explanation:
          "The onboarding policy states that new employees receive access to all relevant tools within the first 48 hours.",
        topic: "Onboarding Steps",
        sourceChunkReference: "Chunk 1 (doc-1-c1)",
        testedSkill: "Policy detail recall",
        pedagogicalGoal: "Verify awareness of tool-access deadline for onboarding coordinators",
        difficulty: "easy",
        whyUseful:
          "Helps employees and managers set correct expectations for system access timelines.",
        status: "needs_review",
      },
      {
        id: "doc-1-q3",
        questionText: "What is the correct order of events described in the onboarding process?",
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
        difficulty: "hard",
        whyUseful:
          "Checks whether employees can reason about the onboarding flow, not just recall isolated facts.",
        status: "approved",
      },
      {
        id: "doc-1-q4",
        questionText:
          "According to the Code of Conduct, what behavior is expected from all employees?",
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
        difficulty: "easy",
        whyUseful: "Establishes shared baseline expectations that reduce workplace conflict.",
        status: "needs_review",
      },
      {
        id: "doc-1-q5",
        questionText: "What is the potential consequence of violating the Code of Conduct?",
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
        difficulty: "medium",
        whyUseful:
          "Clarifies accountability boundaries and reinforces the seriousness of the policy.",
        status: "needs_review",
      },
      {
        id: "doc-1-q6",
        questionText:
          "From which day are employees eligible for health, dental, and vision insurance?",
        options: [
          "After the 30-day probationary period",
          "From the first day of employment",
          "After three months of continuous employment",
          "At the start of the next calendar year",
        ],
        correctAnswer: "From the first day of employment",
        explanation:
          "The benefits section states employees are eligible for health, dental, and vision insurance from the first day of employment.",
        topic: "Benefits & Compensation",
        sourceChunkReference: "Chunk 3 (doc-1-c3)",
        testedSkill: "Benefits eligibility recall",
        pedagogicalGoal: "Confirm employees know their insurance entitlement start date",
        difficulty: "easy",
        whyUseful:
          "Reduces confusion around enrollment timing and supports confident day-one onboarding.",
        status: "needs_review",
      },
      {
        id: "doc-1-q7",
        questionText: "Which statement correctly describes sick leave under this policy?",
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
        difficulty: "medium",
        whyUseful:
          "Prevents employees from conflating sick leave with vacation, supporting responsible absence planning.",
        status: "rejected",
      },
      {
        id: "doc-1-q8",
        questionText:
          "What paid parental leave duration does the policy provide for primary caregivers?",
        options: ["8 weeks", "12 weeks", "16 weeks", "20 weeks"],
        correctAnswer: "16 weeks",
        explanation:
          "The leave policy explicitly states 16 weeks of fully paid parental leave for primary caregivers.",
        topic: "Leave Policies",
        sourceChunkReference: "Chunk 4 (doc-1-c4)",
        testedSkill: "Benefits detail recall",
        pedagogicalGoal: "Test retention of a high-impact employee benefit",
        difficulty: "medium",
        whyUseful: "Ensures awareness of critical family-support policies during onboarding.",
        status: "needs_review",
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
        status: "rejected",
      },
    ],
  },
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
    status: "needs_review",
  }))

  return {
    testTitle: `${document.title} Knowledge Test`,
    difficulty: "medium",
    targetRole: "All employees",
    questionCount: fallbackQuestions.length,
    language: "English",
    selectedTopics,
    questions: fallbackQuestions,
  }
}

export function getMockTestReviewData(document: MockDocumentDetail): MockTestReviewData {
  return mockReviewByDocumentId[document.id] ?? buildFallbackReviewData(document)
}
