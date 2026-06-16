"use client"

import { useCallback, useMemo, useState } from "react"

import { TestAiFeedback } from "@/features/employee/tests/components/test-ai-feedback"
import { TestAnswerReview } from "@/features/employee/tests/components/test-answer-review"
import { TestResultActions } from "@/features/employee/tests/components/test-result-actions"
import { TestResultSummary } from "@/features/employee/tests/components/test-result-summary"
import { TestWeakTopics } from "@/features/employee/tests/components/test-weak-topics"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import type { FollowUpTopicStatus } from "@/features/employee/tests/types/follow-up"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"

interface TestResultPageProps {
  result: EmployeeTestResult
}

function buildInitialFollowUpStatus(
  weakTopics: EmployeeTestResult["weakTopics"],
  followUpsByOriginalQuestionId?: EmployeeTestResult["followUpsByOriginalQuestionId"]
): Record<string, FollowUpTopicStatus> {
  const statusByTopic: Record<string, FollowUpTopicStatus> = Object.fromEntries(
    weakTopics.map((topic) => [topic.topic, "needs_review" as const])
  )

  if (!followUpsByOriginalQuestionId) {
    return statusByTopic
  }

  for (const persisted of Object.values(followUpsByOriginalQuestionId)) {
    if (!persisted.submittedAnswer) continue

    statusByTopic[persisted.followUp.topic] = persisted.submittedAnswer.isCorrect
      ? "topic_understood"
      : "follow_up_completed"
  }

  return statusByTopic
}

export function TestResultPage({ result }: TestResultPageProps) {
  const [followUpStatusByTopic, setFollowUpStatusByTopic] = useState<
    Record<string, FollowUpTopicStatus>
  >(() => buildInitialFollowUpStatus(result.weakTopics, result.followUpsByOriginalQuestionId))

  const handleFollowUpComplete = useCallback((topic: string, isCorrect: boolean) => {
    setFollowUpStatusByTopic((current) => ({
      ...current,
      [topic]: isCorrect ? "topic_understood" : "follow_up_completed",
    }))
  }, [])

  const weakTopicsProps = useMemo(
    () => ({
      weakTopics: result.weakTopics,
      followUpStatusByTopic,
    }),
    [result.weakTopics, followUpStatusByTopic]
  )

  return (
    <div className="page-shell">
      <Breadcrumbs
        items={[
          { label: "My Tests", href: "/employee/tests" },
          { label: result.title, href: `/employee/tests/${result.id}/take` },
          { label: "Result" },
        ]}
      />

      <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-2">
          <TestResultSummary result={result} />

          <TestAiFeedback feedback={result.aiFeedback} />

          <div className="lg:hidden">
            <TestWeakTopics {...weakTopicsProps} />
          </div>

          <TestAnswerReview
            answerReview={result.answerReview}
            testId={result.id}
            attemptId={result.attemptId}
            sourceDocumentId={result.sourceDocumentId}
            followUpsByOriginalQuestionId={result.followUpsByOriginalQuestionId}
            onFollowUpComplete={handleFollowUpComplete}
          />

          <div className="lg:hidden">
            <TestResultActions
              testId={result.id}
              attemptId={result.attemptId}
              sourceDocumentId={result.sourceDocumentId}
              passed={result.passed}
              canRetake={result.canRetake}
              retakeDisabledReason={result.retakeDisabledReason}
            />
          </div>
        </div>

        <aside className="hidden lg:flex lg:flex-col lg:gap-2">
          <TestResultActions
            testId={result.id}
            attemptId={result.attemptId}
            sourceDocumentId={result.sourceDocumentId}
            passed={result.passed}
            canRetake={result.canRetake}
            retakeDisabledReason={result.retakeDisabledReason}
          />
          <TestWeakTopics {...weakTopicsProps} />
        </aside>
      </div>
    </div>
  )
}
