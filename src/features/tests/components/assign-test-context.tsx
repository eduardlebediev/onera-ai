import { FileText } from "lucide-react"
import Link from "next/link"

import type { ResolvedTestListItem } from "@/features/tests/lib/test-source-document"
import { TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"

interface AssignTestContextProps {
  test: ResolvedTestListItem
}

function ContextItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="typography-small text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function AssignTestContext({ test }: AssignTestContextProps) {
  const statusStyle = TEST_STATUS_STYLE[test.status]

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="typography-h3 font-semibold">{test.title}</h2>
          <p className="mt-1 typography-small text-muted-foreground">{test.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={statusStyle.detailBadgeClass}>
            {statusStyle.icon}
            {statusStyle.label}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {test.difficulty}
          </Badge>
          <Badge variant="outline">{test.targetRole}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <ContextItem label="Questions" value={test.questionCount} />
          <ContextItem label="Passing Score" value={`${test.passingScore}%`} />
          <ContextItem label="Assigned Employees" value={test.assignedEmployeesCount} />
          <div className="col-span-2 sm:col-span-1">
            <p className="typography-small text-muted-foreground">Source Document</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <FileText className="size-4 text-muted-foreground" />
              <Link
                href={`/admin/documents/${test.sourceDocument.documentId}`}
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {test.sourceDocument.title}
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
