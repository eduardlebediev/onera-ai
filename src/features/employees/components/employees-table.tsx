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
import { formatDate } from "@/shared/i18n/format"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DataTable } from "@/shared/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header"
import { DataTableSelectionCheckbox } from "@/shared/ui/data-table-selection-checkbox"

type EmployeeTableRow = EmployeeListItem & {
  searchText: string
}

interface EmployeesTableProps {
  employees: EmployeeListItem[]
  nudgingIds: string[]
  selectedIds: Set<string>
  toolbar?: ReactNode
  onNudge: (employeeIds: string[], label: string) => Promise<boolean>
  onOpenPreview: (employee: EmployeeListItem) => void
  onToggleSelected: (employeeId: string) => void
  onSelectAll: (employeeIds: Iterable<string>, selected?: boolean) => void
}

const STATUS_STYLE: Record<
  EmployeeProgressStatus,
  {
    labelKey: `status.employeeProgress.${EmployeeProgressStatus}`
    className: string
    dotClassName: string
  }
> = {
  completed: {
    labelKey: "status.employeeProgress.completed",
    className: "border-green-200 bg-green-50 text-green-700",
    dotClassName: "bg-green-500",
  },
  pending: {
    labelKey: "status.employeeProgress.pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  overdue: {
    labelKey: "status.employeeProgress.overdue",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
}

function formatScore(score: number | null): string {
  return typeof score === "number" ? `${score}%` : "--"
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
  selectedIds,
  toolbar,
  onNudge,
  onOpenPreview,
  onToggleSelected,
  onSelectAll,
}: EmployeesTableProps) {
  const { locale, t } = useTranslation()
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
        id: "select",
        header: ({ table }) => {
          const visibleIds = table.getRowModel().rows.map((row) => row.original.id)
          const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length
          const allVisibleSelected =
            visibleIds.length > 0 && selectedVisibleCount === visibleIds.length

          return (
            <DataTableSelectionCheckbox
              aria-label={t("dataTable.selectAllEmployees")}
              checked={allVisibleSelected}
              indeterminate={selectedVisibleCount > 0 && !allVisibleSelected}
              disabled={visibleIds.length === 0}
              onCheckedChange={(checked) => onSelectAll(visibleIds, checked)}
            />
          )
        },
        enableSorting: false,
        meta: {
          pin: "left",
          width: 56,
          headerClassName: "text-center",
          cellClassName: "text-center",
        },
        cell: ({ row }) => (
          <DataTableSelectionCheckbox
            aria-label={t("dataTable.selectEmployee", { name: row.original.name })}
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => onToggleSelected(row.original.id)}
          />
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.name")} />
        ),
        enableSorting: true,
        meta: { pin: "left", width: 280 },
        cell: ({ row }) => <EmployeeNameCell employee={row.original} />,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.email")} />
        ),
        enableSorting: true,
        meta: { width: 240 },
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        id: "department",
        accessorKey: "department",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.department")} />
        ),
        enableSorting: true,
        meta: { width: 180 },
      },
      {
        id: "progress",
        accessorKey: "progress",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.progress")} />
        ),
        enableSorting: true,
        meta: { width: 170 },
        cell: ({ row }) => <EmployeeProgressCell progress={row.original.progress} />,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.status")} />
        ),
        enableSorting: true,
        meta: { width: 150 },
        cell: ({ row }) => <EmployeeStatusCell status={row.original.status} />,
      },
      {
        id: "averageScore",
        accessorKey: "averageScore",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.score")} />
        ),
        enableSorting: true,
        meta: { width: 120 },
        cell: ({ row }) => formatScore(row.original.averageScore),
      },
      {
        id: "lastActiveAt",
        accessorKey: "lastActiveAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.lastActive")} />
        ),
        enableSorting: true,
        meta: { width: 160 },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.lastActiveAt
              ? formatDate(locale, row.original.lastActiveAt)
              : t("common.noActivity")}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("common.actions"),
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
    [locale, nudgingIds, onNudge, onSelectAll, onToggleSelected, selectedIds, t]
  )

  return (
    <DataTable
      columns={columns}
      data={tableRows}
      searchKey="searchText"
      searchPlaceholder={t("dataTable.searchEmployees")}
      emptyMessage={t("dataTable.emptyEmployees")}
      toolbar={toolbar}
      getRowProps={(row) => ({
        tabIndex: 0,
        role: "button",
        "aria-label": t("dataTable.previewEmployee", { name: row.original.name }),
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
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(employee.name)}
      </div>
      <div>
        <p className="typography-small font-medium text-foreground">{employee.name}</p>
        {employee.memberStatus === "invited" ? (
          <p className="text-xs text-muted-foreground">
            {t("status.employeeProgress.invitePending")}
          </p>
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
  const { t } = useTranslation()

  return (
    <div className="min-w-28">
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("employees.management.progressComplete", { percent: progress })}
      </p>
    </div>
  )
})

const EmployeeStatusCell = memo(function EmployeeStatusCell({
  status,
}: {
  status: EmployeeProgressStatus
}) {
  const { t } = useTranslation()
  const statusStyle = STATUS_STYLE[status]

  return (
    <Badge variant="outline" className={cn("status-badge", statusStyle.className)}>
      <span className={cn("mr-1 size-1.5 rounded-full", statusStyle.dotClassName)} />
      {t(statusStyle.labelKey)}
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
  onNudge: (employeeIds: string[], label: string) => Promise<boolean>
}) {
  const { t } = useTranslation()

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
            toast.message(t("employees.nudge.alreadyCompleted"), {
              description: t("employees.nudge.alreadyCompletedDescription", {
                name: employee.name,
              }),
              position: "bottom-right",
            })
          }
        >
          {t("status.employeeProgress.completed")}
        </Button>
      ) : (
        <Button
          type="button"
          variant={employee.status === "overdue" ? "destructive" : "outline"}
          size="sm"
          disabled={isNudging}
          onClick={() =>
            void onNudge(
              [employee.id],
              employee.status === "overdue"
                ? t("employees.nudge.overdueMessage")
                : t("employees.nudge.defaultMessage")
            )
          }
        >
          <Bell />
          {isNudging ? t("employees.nudge.sending") : t("employees.nudge.nudge")}
        </Button>
      )}
    </div>
  )
})
