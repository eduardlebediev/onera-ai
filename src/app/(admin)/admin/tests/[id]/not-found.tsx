import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { Button } from "@/shared/ui/button"

export default function TestNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <ClipboardList className="size-12 text-muted-foreground" />
      <h1 className="typography-h2">Test not found</h1>
      <p className="max-w-md typography-muted">
        This test ID does not match any test in the demo. Try opening the Security Guidelines
        Knowledge Test from the Tests page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/admin/tests">View Tests</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/tests/test-1">Open Security Guidelines Test</Link>
        </Button>
      </div>
    </div>
  )
}
