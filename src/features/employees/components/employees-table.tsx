"use client"

import { memo, useMemo, type KeyboardEvent, type ReactNode } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Bell } from "lucide-react"
import { toast } from "sonner"

import type {
  EmployeeListItem,
  EmployeeProgressStatus,
} from "@/features/employees/lib/supabase-employees"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DataTable } from "@/shared/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header"

type EmployeeTableRow = EmployeeListItem & {
  searchText: string
}

interface EmployeesTableProps {
  employees: EmployeeListItem[]
  nudgingIds: string[]
  toolbar?: ReactNode
  onNudge: (employeeIds: string[], label: string) => void
  onOpenPreview: (employee: EmployeeListItem) => void
}

const STATUS_STYLE: Record<
  EmployeeProgressStatus,
  { label: string; className: string; dotClassName: string }
> = {
  completed: {
    label: "Completed",
    className: "border-green-200 bg-green-50 text-green-700",
    dotClassName: "bg-green-500",
  },
  pending: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
}

function formatScore(score: number | null): string {
  return typeof score === "number" ? `${score}%` : "--"
}

function formatLastActive(value: string | null): string {
  if (!value) return "No activity"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return initials || "E"
}

function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  employee: EmployeeListItem,
  onOpenPreview: (employee: EmployeeListItem) => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    onOpenPreview(employee)
  }
}

export function EmployeesTable({
  employees,
  nudgingIds,
  toolbar,
  onNudge,
  onOpenPreview,
}: EmployeesTableProps) {
  const tableRows = useMemo<EmployeeTableRow[]>(
    () =>
      employees.map((employee) => ({
        ...employee,
        searchText: `${employee.name} ${employee.email} ${employee.department}`,
      })),
    [employees]
  )

  const columns = useMemo<ColumnDef<EmployeeTableRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        enableSorting: true,
        meta: { pin: "left", width: 280 },
        cell: ({ row }) => <EmployeeNameCell employee={row.original} />,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        enableSorting: true,
        meta: { width: 240 },
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        id: "department",
        accessorKey: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        enableSorting: true,
        meta: { width: 180 },
      },
      {
        id: "progress",
        accessorKey: "progress",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
        enableSorting: true,
        meta: { width: 170 },
        cell: ({ row }) => <EmployeeProgressCell progress={row.original.progress} />,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        enableSorting: true,
        meta: { width: 150 },
        cell: ({ row }) => <EmployeeStatusCell status={row.original.status} />,
      },
      {
        id: "averageScore",
        accessorKey: "averageScore",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
        enableSorting: true,
        meta: { width: 120 },
        cell: ({ row }) => formatScore(row.original.averageScore),
      },
      {
        id: "lastActiveAt",
        accessorKey: "lastActiveAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />,
        enableSorting: true,
        meta: { width: 160 },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatLastActive(row.original.lastActiveAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: {
          pin: "right",
          width: 160,
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <EmployeeActionsCell
            employee={row.original}
            isNudging={nudgingIds.includes(row.original.id)}
            onNudge={onNudge}
          />
        ),
      },
    ],
    [nudgingIds, onNudge]
  )

  return (
    <DataTable
      columns={columns}
      data={tableRows}
      searchKey="searchText"
      searchPlaceholder="Search by name, email, department"
      emptyMessage="No employees match your filters."
      toolbar={toolbar}
      getRowProps={(row) => ({
        tabIndex: 0,
        role: "button",
        "aria-label": `Preview ${row.original.name}`,
        onClick: () => onOpenPreview(row.original),
        onKeyDown: (event) => handleRowKeyDown(event, row.original, onOpenPreview),
        className: "cursor-pointer",
      })}
    />
  )
}

const EmployeeNameCell = memo(function EmployeeNameCell({
  employee,
}: {
  employee: EmployeeTableRow
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(employee.name)}
      </div>
      <div>
        <p className="typography-small font-medium text-foreground">{employee.name}</p>
        {employee.memberStatus === "invited" ? (
          <p className="text-xs text-muted-foreground">Invite pending</p>
        ) : null}
      </div>
    </div>
  )
})

const EmployeeProgressCell = memo(function EmployeeProgressCell({
  progress,
}: {
  progress: number
}) {
  return (
    <div className="min-w-28">
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{progress}% complete</p>
    </div>
  )
})

const EmployeeStatusCell = memo(function EmployeeStatusCell({
  status,
}: {
  status: EmployeeProgressStatus
}) {
  const statusStyle = STATUS_STYLE[status]

  return (
    <Badge variant="outline" className={cn("status-badge", statusStyle.className)}>
      <span className={cn("mr-1 size-1.5 rounded-full", statusStyle.dotClassName)} />
      {statusStyle.label}
    </Badge>
  )
})

const EmployeeActionsCell = memo(function EmployeeActionsCell({
  employee,
  isNudging,
  onNudge,
}: {
  employee: EmployeeTableRow
  isNudging: boolean
  onNudge: (employeeIds: string[], label: string) => void
}) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {employee.status === "completed" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            toast.message("Employee already completed", {
              description: `${employee.name} has completed assigned work.`,
              position: "bottom-right",
            })
          }
        >
          Completed
        </Button>
      ) : (
        <Button
          type="button"
          variant={employee.status === "overdue" ? "destructive" : "outline"}
          size="sm"
          disabled={isNudging}
          onClick={() =>
            onNudge(
              [employee.id],
              employee.status === "overdue"
                ? "Please complete your overdue assigned training."
                : "Please complete your assigned training."
            )
          }
        >
          <Bell />
          {isNudging ? "Sending..." : "Nudge"}
        </Button>
      )}
    </div>
  )
})
