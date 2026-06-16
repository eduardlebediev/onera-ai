import { ChevronRight, FileText } from "lucide-react"
import Link from "next/link"

import type { ResolvedTestListItem } from "@/features/tests/lib/test-source-document"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { Badge } from "@/shared/ui/badge"

interface TestDetailHeaderProps {
  test: ResolvedTestListItem
}

export function TestDetailHeader({ test }: TestDetailHeaderProps) {
  const statusStyle = TEST_STATUS_STYLE[test.status]

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/tests" className="hover:text-foreground">
          Tests
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{test.title}</span>
      </div>

      <div>
        <h1 className="typography-h1">{test.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className={statusStyle.detailBadgeClass}>
            {statusStyle.icon}
            {statusStyle.label}
          </Badge>
          <span className="text-border">|</span>
          <span className="capitalize">{test.difficulty}</span>
          <span className="text-border">|</span>
          <span>{test.targetRole}</span>
          <span className="text-border">|</span>
          <span>{test.language}</span>
          <span className="text-border">|</span>
          <span>Passing score {test.passingScore}%</span>
          <span className="text-border">|</span>
          <span>Created {formatTestDate(test.createdAt)}</span>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <FileText className="size-4 text-muted-foreground" />
            <Link
              href={`/admin/documents/${test.sourceDocument.documentId}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {test.sourceDocument.title}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
