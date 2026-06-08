export type FollowUpDifficulty = "easy" | "medium" | "hard"

export type FollowUpTopicStatus = "needs_review" | "follow_up_completed" | "topic_understood"

export interface FollowUpQuestionOption {
  id: string
  label: string
}

export interface FollowUpQuestion {
  id: string
  originalQuestionId: string
  topic: string
  sourceChunkReference: string
  explanationBeforeQuestion: string
  questionText: string
  options: FollowUpQuestionOption[]
  correctOptionId: string
  explanationAfterAnswer: string
  learningGoal: string
  difficulty: FollowUpDifficulty
}

const mockFollowUpQuestions: FollowUpQuestion[] = [
  {
    id: "follow-up-test-1-q5",
    originalQuestionId: "test-1-q5",
    topic: "Leave Policies",
    sourceChunkReference: "Chunk 4 (doc-1-c4)",
    explanationBeforeQuestion:
      "You missed the sick leave policy distinction. The key idea is that sick leave is separate from paid vacation and is not capped at a fixed number of days annually.",
    questionText:
      "An employee needs to take a sick day. Which statement best reflects the sick leave policy?",
    options: [
      { id: "opt-a", label: "Sick leave counts against the annual vacation allowance" },
      { id: "opt-b", label: "Sick leave is separate from vacation and has no annual cap" },
      { id: "opt-c", label: "Sick leave is limited to 10 days per year" },
      { id: "opt-d", label: "Sick leave requires pre-approval for every absence" },
    ],
    correctOptionId: "opt-b",
    explanationAfterAnswer:
      "Sick leave is tracked separately from paid vacation. There is no annual cap, though employees should follow standard notification procedures.",
    learningGoal: "Differentiate sick leave from vacation entitlements",
    difficulty: "medium",
  },
  {
    id: "follow-up-test-5-q2",
    originalQuestionId: "test-5-q2",
    topic: "Escalation Paths",
    sourceChunkReference: "Chunk 2 (doc-4-c2)",
    explanationBeforeQuestion:
      "You missed the P0 escalation routing rule. The key idea is that P0 incidents bypass standard escalation tiers and go directly to the on-call engineering lead.",
    questionText:
      "A P0 production incident is detected. What is the correct first escalation step?",
    options: [
      { id: "opt-a", label: "Route through Tier-1 support queue" },
      { id: "opt-b", label: "Escalate directly to the on-call engineering lead" },
      { id: "opt-c", label: "Wait for the next business day review" },
      { id: "opt-d", label: "Assign to the standard Tier-2 queue" },
    ],
    correctOptionId: "opt-b",
    explanationAfterAnswer:
      "P0 issues bypass standard escalation paths. The on-call engineering lead must be notified immediately to begin incident response.",
    learningGoal: "Apply correct P0 escalation routing under pressure",
    difficulty: "hard",
  },
]

export function getFollowUpQuestionByOriginalQuestionId(
  questionId: string
): FollowUpQuestion | null {
  return mockFollowUpQuestions.find((item) => item.originalQuestionId === questionId) ?? null
}

export function getFollowUpTopicStatusLabel(status: FollowUpTopicStatus): string {
  switch (status) {
    case "needs_review":
      return "Needs review"
    case "follow_up_completed":
      return "Follow-up completed"
    case "topic_understood":
      return "Topic understood"
  }
}
