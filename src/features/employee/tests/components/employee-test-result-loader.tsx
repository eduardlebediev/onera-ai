"use client"

import { useMemo } from "react"

import { TestResultNotFound } from "@/features/employee/tests/components/test-result-not-found"
import { TestResultPage } from "@/features/employee/tests/components/test-result-page"
import { getTakeSessionAnswers } from "@/features/employee/tests/lib/take-session"
import { getEmployeeTestResult } from "@/features/employee/tests/lib/test-result-model"

interface EmployeeTestResultLoaderProps {
  testId: string
}

export function EmployeeTestResultLoader({ testId }: EmployeeTestResultLoaderProps) {
  const result = useMemo(() => {
    const sessionAnswers = getTakeSessionAnswers(testId)
    return getEmployeeTestResult(testId, sessionAnswers ?? undefined)
  }, [testId])

  if (!result) {
    return <TestResultNotFound />
  }

  return <TestResultPage result={result} />
}
