import { CheckCircle2, Clock, FileEdit } from "lucide-react"
import type { ReactNode } from "react"

import type { TestStatus } from "@/features/tests/types/test"

export interface TestStatusStyle {
  label: string
  dotClass: string
  listBadgeClass: string
  detailBadgeClass: string
  icon: ReactNode
}

export const TEST_STATUS_STYLE: Record<TestStatus, TestStatusStyle> = {
  published: {
    label: "Published",
    dotClass: "bg-emerald-500",
    listBadgeClass:
      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30",
    detailBadgeClass:
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <CheckCircle2 className="mr-1 size-3" />,
  },
  draft: {
    label: "Draft",
    dotClass: "bg-orange-500",
    listBadgeClass:
      "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30",
    detailBadgeClass:
      "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    icon: <FileEdit className="mr-1 size-3" />,
  },
  archived: {
    label: "Archived",
    dotClass: "bg-muted-foreground",
    listBadgeClass: "bg-muted text-muted-foreground border-border",
    detailBadgeClass: "bg-muted text-muted-foreground hover:bg-muted",
    icon: <Clock className="mr-1 size-3" />,
  },
}
