export type EmployeeTestAttemptAnswers = Record<string, string>

export interface ResultWeakTopicRecord {
  topic: string
  missedQuestionsCount: number
  explanation: string
  recommendedAction: string
}

export interface ResultAiFeedbackRecord {
  performanceSummary: string
  understoodWell: string
  needsImprovement: string
  recommendedNextStep: string
}

export interface EmployeeTestAttemptRecord {
  testId: string
  completedDate: string
  timeSpentMinutes: number
  employeeAnswers: EmployeeTestAttemptAnswers
  weakTopics: ResultWeakTopicRecord[]
  aiFeedback: ResultAiFeedbackRecord
}

const mockEmployeeTestAttempts: EmployeeTestAttemptRecord[] = [
  {
    testId: "test-2",
    completedDate: "2026-06-06",
    timeSpentMinutes: 11,
    employeeAnswers: {
      "test-2-q1": "Immediately after identification",
      "test-2-q2": "East garden",
      "test-2-q3": "Within 24 hours",
      "test-2-q4": "True",
    },
    weakTopics: [],
    aiFeedback: {
      performanceSummary:
        "You scored 100% and passed the Safety & Compliance Assessment with a perfect result.",
      understoodWell:
        "You demonstrated strong recall of hazard reporting timing, emergency assembly locations, and incident documentation requirements.",
      needsImprovement:
        "No weak areas were identified in this attempt. Continue applying these procedures during routine safety checks.",
      recommendedNextStep:
        "Keep the emergency procedures reference handy and participate in the next quarterly safety drill to maintain readiness.",
    },
  },
  {
    testId: "test-5",
    completedDate: "2026-04-18",
    timeSpentMinutes: 9,
    employeeAnswers: {
      "test-5-q1": "Within 24 hours",
      "test-5-q2": "False",
      "test-5-q3": "Within 2 business hours",
    },
    weakTopics: [
      {
        topic: "Escalation Paths",
        missedQuestionsCount: 1,
        explanation:
          "P0 issues bypass standard escalation and go directly to the on-call engineering lead.",
        recommendedAction: "Review the Escalation Paths section in the support playbook.",
      },
      {
        topic: "Incident Reporting",
        missedQuestionsCount: 1,
        explanation:
          "Security incidents must be reported immediately after identification, not within 24 hours.",
        recommendedAction: "Review escalation rules before retaking the test.",
      },
      {
        topic: "P0 Routing",
        missedQuestionsCount: 1,
        explanation:
          "P0 incidents require direct routing to the on-call lead without waiting for Tier-2 review.",
        recommendedAction: "Study the P0 routing checklist in the support protocols document.",
      },
    ],
    aiFeedback: {
      performanceSummary:
        "You scored 67% and did not meet the 70% passing threshold on the Support Protocols Test.",
      understoodWell:
        "You answered the SLA definition questions correctly, showing familiarity with Tier-1 and Tier-2 response expectations.",
      needsImprovement:
        "You missed the P0 escalation routing question. P0 incidents bypass standard escalation and go directly to the on-call engineering lead.",
      recommendedNextStep:
        "Review the Escalation Paths section before retaking this test. Pay special attention to P0 routing rules.",
    },
  },
]

export function getEmployeeTestAttemptByTestId(testId: string): EmployeeTestAttemptRecord | null {
  return mockEmployeeTestAttempts.find((attempt) => attempt.testId === testId) ?? null
}
