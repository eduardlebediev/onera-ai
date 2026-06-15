"use client"

import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnPinningState,
  type Row,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { DataTablePagination } from "@/shared/ui/data-table/data-table-pagination"
import { DataTableToolbar } from "@/shared/ui/data-table/data-table-toolbar"
import { useDataTableState } from "@/shared/ui/data-table/use-data-table-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    pin?: "left" | "right"
    width?: number
    headerClassName?: string
    cellClassName?: string
  }
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  total?: number
  loading?: boolean
  toolbar?: ReactNode
  emptyMessage?: string
  getRowProps?: (row: Row<TData>) => React.HTMLAttributes<HTMLTableRowElement>
}

function getColumnId<TData, TValue>(column: ColumnDef<TData, TValue>): string | null {
  if (typeof column.id === "string") {
    return column.id
  }

  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey
  }

  return null
}

function getSearchValue<TData>(row: TData, searchKey: string): string {
  const value = row[searchKey as keyof TData]
  return typeof value === "string" || typeof value === "number" ? String(value) : ""
}

function getPinningState<TData, TValue>(columns: ColumnDef<TData, TValue>[]): ColumnPinningState {
  return columns.reduce<ColumnPinningState>(
    (pinning, column) => {
      const columnId = getColumnId(column)

      if (!columnId || !column.meta?.pin) {
        return pinning
      }

      if (column.meta.pin === "left") {
        pinning.left = [...(pinning.left ?? []), columnId]
      } else {
        pinning.right = [...(pinning.right ?? []), columnId]
      }

      return pinning
    },
    { left: [], right: [] }
  )
}

function getColumnSizing<TData, TValue>(
  columns: ColumnDef<TData, TValue>[]
): Record<string, number> {
  return columns.reduce<Record<string, number>>((sizing, column) => {
    const columnId = getColumnId(column)

    if (columnId && column.meta?.width) {
      sizing[columnId] = column.meta.width
    }

    return sizing
  }, {})
}

function getPinnedStyle<TData, TValue>(column: Column<TData, TValue>): CSSProperties {
  const pin = column.getIsPinned()

  if (!pin) {
    return {
      width: column.getSize(),
      minWidth: column.getSize(),
    }
  }

  return {
    left: pin === "left" ? `${column.getStart("left")}px` : undefined,
    right: pin === "right" ? `${column.getAfter("right")}px` : undefined,
    position: "sticky",
    width: column.getSize(),
    minWidth: column.getSize(),
    zIndex: 20,
  }
}

function getPinnedClassName<TData, TValue>(column: Column<TData, TValue>) {
  const pin = column.getIsPinned()

  if (!pin) {
    return ""
  }

  return cn(
    "bg-card",
    pin === "left" && column.getIsLastColumn("left")
      ? "shadow-[8px_0_8px_-8px_rgb(15_23_42_/_0.2)]"
      : "",
    pin === "right" && column.getIsFirstColumn("right")
      ? "shadow-[-8px_0_8px_-8px_rgb(15_23_42_/_0.2)]"
      : ""
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  pageSize = 10,
  total,
  loading = false,
  toolbar,
  emptyMessage = "No results found.",
  getRowProps,
}: DataTableProps<TData, TValue>) {
  const columnPinning = useMemo(() => getPinningState(columns), [columns])
  const columnSizing = useMemo(() => getColumnSizing(columns), [columns])
  const { search, setSearch, sorting, onSortingChange, pagination, onPaginationChange } =
    useDataTableState({ pageSize })

  // TanStack Table returns instance functions, which React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnPinning,
      columnSizing,
      globalFilter: search,
    },
    defaultColumn: {
      size: 160,
      minSize: 80,
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!searchKey) return true

      const normalizedFilter = String(filterValue ?? "")
        .trim()
        .toLowerCase()

      if (!normalizedFilter) return true

      return getSearchValue(row.original, searchKey).toLowerCase().includes(normalizedFilter)
    },
    enableSortingRemoval: false,
    onSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  useEffect(() => {
    const pageCount = table.getPageCount()

    if (pageCount > 0 && table.getState().pagination.pageIndex >= pageCount) {
      table.setPageIndex(pageCount - 1)
    }
  }, [data.length, search, table])

  const visibleColumnsCount = table.getVisibleLeafColumns().length

  return (
    <div className="w-full">
      <DataTableToolbar
        search={search}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={searchKey ? setSearch : undefined}
        toolbar={toolbar}
      />
      <div className="overflow-x-auto">
        <Table style={{ minWidth: table.getTotalSize() }}>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-xs font-medium text-muted-foreground",
                      getPinnedClassName(header.column),
                      header.column.columnDef.meta?.headerClassName
                    )}
                    style={getPinnedStyle(header.column)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={visibleColumnsCount} className="h-32 text-center">
                  <p className="typography-p text-muted-foreground">Loading table data...</p>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const rowProps = getRowProps?.(row) ?? {}

                return (
                  <TableRow key={row.id} {...rowProps} className={cn(rowProps.className)}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-4",
                          getPinnedClassName(cell.column),
                          cell.column.columnDef.meta?.cellClassName
                        )}
                        style={getPinnedStyle(cell.column)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnsCount} className="h-32 text-center">
                  <p className="typography-p text-muted-foreground">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} total={total} />
    </div>
  )
}
