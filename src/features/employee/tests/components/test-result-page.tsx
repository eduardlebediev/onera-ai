"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { TestAiFeedback } from "@/features/employee/tests/components/test-ai-feedback"
import { TestAnswerReview } from "@/features/employee/tests/components/test-answer-review"
import { TestResultActions } from "@/features/employee/tests/components/test-result-actions"
import { TestResultKpiSection } from "@/features/employee/tests/components/test-result-kpi-section"
import { TestResultSummary } from "@/features/employee/tests/components/test-result-summary"
import { TestWeakTopics } from "@/features/employee/tests/components/test-weak-topics"
import type { EmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"
import type { FollowUpTopicStatus } from "@/features/employee/tests/mock/follow-up-questions"
import { Button } from "@/shared/ui/button"

interface TestResultPageProps {
  result: EmployeeTestResult
}

function buildInitialFollowUpStatus(
  weakTopics: EmployeeTestResult["weakTopics"]
): Record<string, FollowUpTopicStatus> {
  return Object.fromEntries(weakTopics.map((topic) => [topic.topic, "needs_review" as const]))
}

export function TestResultPage({ result }: TestResultPageProps) {
  const [followUpStatusByTopic, setFollowUpStatusByTopic] = useState<
    Record<string, FollowUpTopicStatus>
  >(() => buildInitialFollowUpStatus(result.weakTopics))

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
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/employee/tests">
            <ArrowLeft className="size-4" />
            Back to My Tests
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <TestResultSummary result={result} />

          <div className="lg:hidden">
            <TestResultKpiSection result={result} />
          </div>

          <TestAiFeedback feedback={result.aiFeedback} />

          <div className="lg:hidden">
            <TestWeakTopics {...weakTopicsProps} />
          </div>

          <TestAnswerReview
            answerReview={result.answerReview}
            sourceDocumentId={result.sourceDocumentId}
            onFollowUpComplete={handleFollowUpComplete}
          />

          <div className="lg:hidden">
            <TestResultActions testId={result.id} sourceDocumentId={result.sourceDocumentId} />
          </div>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <TestResultKpiSection result={result} />
          <TestWeakTopics {...weakTopicsProps} />
          <TestResultActions testId={result.id} sourceDocumentId={result.sourceDocumentId} />
        </aside>
      </div>
    </div>
  )
}
