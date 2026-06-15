import type { ReactNode } from "react"

interface DataTableBulkActionsProps {
  selectedCount: number
  children: ReactNode
}

export function DataTableBulkActions({ selectedCount, children }: DataTableBulkActionsProps) {
  if (selectedCount < 1) {
    return null
  }

  return (
    <div className="border-b border-border/50 bg-primary/5 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="typography-small font-medium text-foreground">{selectedCount} selected</p>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
