import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface AssignBreadcrumbProps {
  testId: string
  testTitle: string
  className?: string
}

export function AssignBreadcrumb({ testId, testTitle, className }: AssignBreadcrumbProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Link href="/admin/tests" className="hover:text-foreground">
        Tests
      </Link>
      <ChevronRight className="size-4" />
      <Link href={`/admin/tests/${testId}`} className="hover:text-foreground">
        {testTitle}
      </Link>
      <ChevronRight className="size-4" />
      <span className="text-foreground">Assign</span>
    </div>
  )
}
