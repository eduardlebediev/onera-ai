"use client"

import type { Table as ReactTable } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"

interface DataTablePaginationProps<TData> {
  table: ReactTable<TData>
  total?: number
}

export function DataTablePagination<TData>({ table, total }: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const pageCount = table.getPageCount()
  const currentPage = pageCount > 0 ? table.getState().pagination.pageIndex + 1 : 1
  const rowCount = total ?? table.getFilteredRowModel().rows.length
  const pageSize = table.getState().pagination.pageSize

  return (
    <div className="flex flex-col gap-3 border-t border-border/50 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {t("common.rowsPerPage", {
          count: rowCount,
          plural: rowCount === 1 ? "" : "s",
          pageSize,
        })}
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          {t("common.pageOf", { current: currentPage, total: Math.max(pageCount, 1) })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            disabled={!table.getCanPreviousPage()}
            aria-label={t("common.previousPage")}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            disabled={!table.getCanNextPage()}
            aria-label={t("common.nextPage")}
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
