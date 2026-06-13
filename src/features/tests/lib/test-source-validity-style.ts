export type TestSourceValidity =
  | "valid"
  | "outdated"
  | "source_archived"
  | "source_deleted"
  | "needs_review"

export interface TestSourceValidityStyle {
  label: string
  dotClass: string
  badgeClass: string
}

export const TEST_SOURCE_VALIDITY_STYLE: Record<TestSourceValidity, TestSourceValidityStyle> = {
  valid: {
    label: "Valid source",
    dotClass: "bg-green-500",
    badgeClass:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400",
  },
  outdated: {
    label: "Outdated source",
    dotClass: "bg-orange-500",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400",
  },
  source_archived: {
    label: "Source archived",
    dotClass: "bg-amber-500",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400",
  },
  source_deleted: {
    label: "Source deleted",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400",
  },
  needs_review: {
    label: "Needs review",
    dotClass: "bg-purple-500",
    badgeClass:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400",
  },
}

export function normalizeTestSourceValidity(value: string | null | undefined): TestSourceValidity {
  if (
    value === "valid" ||
    value === "outdated" ||
    value === "source_archived" ||
    value === "source_deleted" ||
    value === "needs_review"
  ) {
    return value
  }

  return "valid"
}

export function isSourceBlockingValidity(value: TestSourceValidity): boolean {
  return value === "source_archived" || value === "source_deleted" || value === "needs_review"
}

export const INACTIVE_TEST_START_MESSAGE =
  "This test is no longer active because its source document is invalid."

export function isTestAssignable(input: {
  status: string
  isActive: boolean
  sourceValidity: string
}): boolean {
  return (
    input.status === "published" &&
    input.isActive &&
    (input.sourceValidity === "valid" || input.sourceValidity === "outdated")
  )
}
