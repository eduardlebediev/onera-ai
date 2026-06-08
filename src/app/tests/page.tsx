import { TestsListPage } from "@/features/tests/components/tests-list-page"
import { resolveMockTest } from "@/features/tests/lib/test-source-document"
import { mockTests } from "@/features/tests/mock/tests"

export default function TestsPage() {
  return <TestsListPage tests={mockTests.map(resolveMockTest)} />
}
