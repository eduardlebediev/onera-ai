import type { TestTakingAnswers } from "@/features/employee/tests/lib/test-taking-state"

const TAKE_SESSION_PREFIX = "ontera-take-"

function getTakeSessionKey(testId: string): string {
  return `${TAKE_SESSION_PREFIX}${testId}`
}

export interface TakeSessionRecord {
  answers: TestTakingAnswers
  submittedAt: string
  timeSpentMinutes: number
}

export function saveTakeSession(testId: string, record: TakeSessionRecord): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(getTakeSessionKey(testId), JSON.stringify(record))
  } catch {
    // Ignore storage errors in demo mode
  }
}

export function getTakeSessionAnswers(testId: string): TestTakingAnswers | null {
  const record = loadTakeSession(testId)
  return record?.answers ?? null
}

export function loadTakeSession(testId: string): TakeSessionRecord | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(getTakeSessionKey(testId))
    if (!raw) return null

    return JSON.parse(raw) as TakeSessionRecord
  } catch {
    return null
  }
}
