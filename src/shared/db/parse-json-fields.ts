import type { Json } from "@/lib/supabase/types"

export type ParsedOption = {
  id: string
  text: string
}

export type ParsedCorrectAnswer = {
  optionIds: string[]
  expectedAnswer?: string
}

export type ParsedUserAnswer = {
  selectedOptionIds: string[]
  openText?: string
  gradingRationale?: string
  needsManualReview?: boolean
}

export function parseOptions(value: Json): ParsedOption[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "text" in item &&
      typeof item.id === "string" &&
      typeof item.text === "string"
    ) {
      return [{ id: item.id, text: item.text }]
    }

    return []
  })
}

export function parseCorrectAnswer(value: Json): ParsedCorrectAnswer {
  if (typeof value !== "object" || value === null) {
    return { optionIds: [] }
  }

  const record = value as Record<string, unknown>
  const optionIds = Array.isArray(record.optionIds)
    ? record.optionIds.filter((optionId): optionId is string => typeof optionId === "string")
    : []
  const expectedAnswer =
    typeof record.expectedAnswer === "string" ? record.expectedAnswer : undefined

  return { optionIds, expectedAnswer }
}

export function parseUserAnswer(value: Json): ParsedUserAnswer {
  if (typeof value !== "object" || value === null) {
    return { selectedOptionIds: [] }
  }

  const record = value as Record<string, unknown>
  const selectedOptionIds = Array.isArray(record.selectedOptionIds)
    ? record.selectedOptionIds.filter((id): id is string => typeof id === "string")
    : []
  const openText = typeof record.openText === "string" ? record.openText : undefined
  const gradingRationale =
    typeof record.gradingRationale === "string" ? record.gradingRationale : undefined
  const needsManualReview =
    typeof record.needsManualReview === "boolean" ? record.needsManualReview : undefined

  return { selectedOptionIds, openText, gradingRationale, needsManualReview }
}
