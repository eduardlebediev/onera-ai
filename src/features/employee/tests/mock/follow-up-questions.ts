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
  correctOptionId?: string
  explanationAfterAnswer: string
  learningGoal: string
  difficulty: FollowUpDifficulty
}

const mockFollowUpQuestions: FollowUpQuestion[] = [
  {
    id: "follow-up-test-1-q5",
    originalQuestionId: "test-1-q5",
    topic: "Phishing & Social Engineering",
    sourceChunkReference: "Chunk 4 (doc-1-c4)",
    explanationBeforeQuestion:
      "You clicked a link in a suspicious email instead of reporting it. The key rule is: never click links or download attachments from unknown senders — always use the Report Phishing button.",
    questionText:
      "You receive an email claiming to be from IT asking you to verify your account by clicking a link. What is the correct response?",
    options: [
      { id: "opt-a", label: "Click the link to verify your account quickly" },
      { id: "opt-b", label: "Reply to the email asking if it is legitimate" },
      { id: "opt-c", label: "Report it using the Report Phishing button" },
      { id: "opt-d", label: "Forward it to a colleague to check" },
    ],
    correctOptionId: "opt-c",
    explanationAfterAnswer:
      "Security will never ask for your password via email. Report suspicious emails immediately using the Report Phishing button — do not click links or reply.",
    learningGoal: "Apply correct phishing response behavior under pressure",
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
