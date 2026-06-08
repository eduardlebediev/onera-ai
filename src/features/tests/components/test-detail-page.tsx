import Link from "next/link"

import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import { TestAssignmentsSection } from "@/features/tests/components/test-assignments-section"
import { TestDetailHeader } from "@/features/tests/components/test-detail-header"
import { TestQuestionsSection } from "@/features/tests/components/test-questions-section"
import { TestResultsSection } from "@/features/tests/components/test-results-section"
import { TestSettingsSection } from "@/features/tests/components/test-settings-section"
import { TestSourceDocumentsSection } from "@/features/tests/components/test-source-documents-section"
import { Button } from "@/shared/ui/button"

interface TestDetailPageProps {
  test: ResolvedMockTest
}

export function TestDetailPage({ test }: TestDetailPageProps) {
  return (
    <div className="page-shell-narrow">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <TestDetailHeader test={test} />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {test.status === "draft" && (
            <>
              <Button asChild variant="outline">
                <Link
                  href={`/tests/review?documentId=${encodeURIComponent(test.sourceDocument.documentId)}`}
                  title="Opens document review flow; mock phase has no per-test draft editor yet"
                >
                  Edit draft
                </Link>
              </Button>
              <Button disabled title="Publish this test before assigning it to employees.">
                Assign to Employees
              </Button>
              <Button disabled title="Coming soon">
                Publish
              </Button>
              <Button variant="outline" disabled title="Coming soon">
                Archive
              </Button>
            </>
          )}
          {test.status === "published" && (
            <>
              <Button asChild>
                <Link href={`/tests/${test.id}/assign`}>Assign to Employees</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="#results">View results</Link>
              </Button>
              <Button variant="outline" disabled title="Coming soon">
                Archive
              </Button>
            </>
          )}
          {test.status === "archived" && (
            <Button variant="outline" disabled title="Coming soon">
              Restore
            </Button>
          )}
        </div>
      </div>

      {test.status === "draft" && (
        <p className="mb-4 typography-small text-muted-foreground">
          Publish this test before assigning it to employees.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <TestQuestionsSection questions={test.questions} />
          <TestResultsSection results={test.results} id="results" />
        </div>
        <div className="space-y-2">
          <TestSettingsSection test={test} />
          <TestSourceDocumentsSection source={test.sourceDocument} />
          <TestAssignmentsSection
            assignments={test.assignments}
            testId={test.id}
            testStatus={test.status}
          />
        </div>
      </div>
    </div>
  )
}
