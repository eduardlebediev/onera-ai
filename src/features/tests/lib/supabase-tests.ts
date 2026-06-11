import "server-only"

import type { DocumentStatus } from "@/data/mock/documents"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import type { TestDifficulty, TestLanguage, TestStatus } from "@/features/tests/mock/tests"
import { createAdminClient } from "@/lib/supabase/admin"

export type TestsListResult = {
  tests: ResolvedMockTest[]
  source: "supabase" | "fallback"
}

type TestRow = {
  id: string
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
}

type DocumentTitleRow = {
  id: string
  title: string
  status: string
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
    status === "uploaded"
  ) {
    return status
  }

  return "ready"
}

function mapTestRowToListItem(
  test: TestRow,
  sourceDocument: DocumentTitleRow | undefined
): ResolvedMockTest {
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

export async function getTestsFromSupabase(): Promise<TestsListResult> {
  const supabase = createAdminClient()

  const { data: tests, error } = await supabase
    .from("tests")
    .select(
      "id, title, description, status, difficulty, language, target_role, question_count, passing_score, source_document_id, published_at, created_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tests: ${error.message}`)
  }

  const testRows = (tests ?? []) as TestRow[]

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
