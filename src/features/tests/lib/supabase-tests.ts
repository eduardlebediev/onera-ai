import "server-only"

import type { DocumentStatus } from "@/features/documents/types/document"
import type { ResolvedTestListItem } from "@/features/tests/lib/test-source-document"
import type { TestDifficulty, TestLanguage, TestStatus } from "@/features/tests/types/test"
import { createAdminClient } from "@/lib/supabase/admin"

export type TestsListResult = {
  tests: ResolvedTestListItem[]
  source: "supabase" | "fallback"
}

type TestRow = {
  id: string
  organization_id: string
  title: string
  description: string | null
  status: string
  difficulty: string
  language: string
  target_role: string | null
  question_count: number | null
  passing_score: number
  source_document_id: string | null
  published_at: string | null
  created_at: string
  is_active: boolean
  source_validity: string
  source_invalid_reason: string | null
}

type DocumentTitleRow = {
  id: string
  title: string
  status: string
}

type SupabaseQueryError = {
  code?: string
  message?: string
}

const LEGACY_TEST_SELECT =
  "id, organization_id, title, description, status, difficulty, language, target_role, question_count, passing_score, source_document_id, published_at, created_at"

const TEST_SELECT = `${LEGACY_TEST_SELECT}, is_active, source_validity, source_invalid_reason`

function isMissingTestSourceColumnsError(error: SupabaseQueryError): boolean {
  const message = error.message ?? ""

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    ((message.includes("is_active") ||
      message.includes("source_validity") ||
      message.includes("source_invalid_reason")) &&
      (message.includes("does not exist") || message.includes("schema cache")))
  )
}

function normalizeTestRows(rows: unknown[] | null): TestRow[] {
  return (rows ?? []).map((row) => {
    const test = row as Partial<TestRow>

    return {
      ...test,
      is_active: test.is_active ?? true,
      source_validity: test.source_validity ?? "valid",
      source_invalid_reason: test.source_invalid_reason ?? null,
    } as TestRow
  })
}

function warnMissingTestSourceColumnsFallback(): void {
  console.warn(
    "Test source-validity columns are not available yet; falling back to the pre-00006 tests select. Apply supabase/migrations/00006_document_archive_delete_and_test_inactivation.sql to enable inactive/source validity metadata."
  )
}

function mapLanguage(language: string): TestLanguage {
  return language === "de" ? "German" : "English"
}

function mapDifficulty(difficulty: string): TestDifficulty {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    return difficulty
  }

  return "medium"
}

function mapStatus(status: string): TestStatus {
  if (status === "published" || status === "archived") {
    return status
  }

  return "draft"
}

function mapDocumentStatus(status: string): DocumentStatus {
  if (
    status === "ready" ||
    status === "processing" ||
    status === "failed" ||
    status === "uploaded" ||
    status === "archived" ||
    status === "deleted"
  ) {
    return status
  }

  return "ready"
}

function mapTestRowToListItem(
  test: TestRow,
  sourceDocument: DocumentTitleRow | undefined
): ResolvedTestListItem {
  const createdAt = (test.published_at ?? test.created_at).slice(0, 10)

  return {
    id: test.id,
    title: test.title,
    description: test.description ?? "",
    status: mapStatus(test.status),
    difficulty: mapDifficulty(test.difficulty),
    targetRole: test.target_role ?? "All employees",
    language: mapLanguage(test.language),
    questionCount: test.question_count ?? 0,
    passingScore: test.passing_score,
    selectedTopics: [],
    selectedChunksCount: 0,
    createdAt,
    assignedEmployeesCount: 0,
    attemptsCount: 0,
    isActive: test.is_active ?? true,
    sourceValidity: test.source_validity ?? "valid",
    sourceInvalidReason: test.source_invalid_reason,
    sourceDocument: {
      documentId: test.source_document_id ?? "unknown",
      topicsUsed: [],
      chunksUsed: 0,
      title: sourceDocument?.title ?? "Unknown document",
      status: mapDocumentStatus(sourceDocument?.status ?? "ready"),
    },
    questions: [],
    assignments: {
      assigned: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    },
    results: {
      averageScore: 0,
      passRate: 0,
      weakTopics: [],
      recentAttempts: [],
    },
  }
}

export async function getTestsFromSupabase(organizationId: string): Promise<TestsListResult> {
  const supabase = createAdminClient()

  const { data: tests, error } = await supabase
    .from("tests")
    .select(TEST_SELECT)
    .eq("organization_id", organizationId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })

  let testRows = normalizeTestRows(tests as unknown[] | null)

  if (error && isMissingTestSourceColumnsError(error)) {
    warnMissingTestSourceColumnsFallback()

    const { data: legacyTests, error: legacyError } = await supabase
      .from("tests")
      .select(LEGACY_TEST_SELECT)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })

    if (legacyError) {
      throw new Error(`Failed to fetch tests: ${legacyError.message}`)
    }

    testRows = normalizeTestRows(legacyTests as unknown[] | null).filter(
      (test) => test.status !== "deleted"
    )
  } else if (error) {
    throw new Error(`Failed to fetch tests: ${error.message}`)
  }

  if (testRows.length === 0) {
    return { tests: [], source: "supabase" }
  }

  const sourceDocumentIds = Array.from(
    new Set(
      testRows.map((test) => test.source_document_id).filter((id): id is string => Boolean(id))
    )
  )

  const documentsById = new Map<string, DocumentTitleRow>()

  if (sourceDocumentIds.length > 0) {
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id, title, status")
      .in("id", sourceDocumentIds)

    if (documentsError) {
      throw new Error(`Failed to fetch source documents: ${documentsError.message}`)
    }

    for (const document of (documents ?? []) as DocumentTitleRow[]) {
      documentsById.set(document.id, document)
    }
  }

  return {
    tests: testRows.map((test) =>
      mapTestRowToListItem(
        test,
        test.source_document_id ? documentsById.get(test.source_document_id) : undefined
      )
    ),
    source: "supabase",
  }
}
