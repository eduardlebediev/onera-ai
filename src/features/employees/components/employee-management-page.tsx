"use client"

import { Bell, MailPlus, Send, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { AssignSelectedEmployeesModal } from "@/features/employees/components/assign-selected-employees-modal"
import { EmployeeDetailDrawer } from "@/features/employees/components/employee-detail-drawer"
import { EmployeesKpiSection } from "@/features/employees/components/employees-kpi-section"
import { EmployeesTable } from "@/features/employees/components/employees-table"
import { InviteEmployeeModal } from "@/features/employees/components/invite-employee-modal"
import type { EmployeeDetail } from "@/features/employees/lib/supabase-employee-detail"
import type {
  EmployeeListItem,
  EmployeeManagementData,
  EmployeeProgressStatus,
} from "@/features/employees/lib/supabase-employees"
import { Button } from "@/shared/ui/button"
import { DataTableFilterSelect } from "@/shared/ui/data-table/data-table-filter-select"
import { DataTableBulkActions } from "@/shared/ui/data-table-bulk-actions"
import { DataTableShell } from "@/shared/ui/data-table-shell"
import { useSelection } from "@/shared/ui/use-selection"

type StatusFilter = "all" | EmployeeProgressStatus

type InviteResponse = {
  employee?: EmployeeListItem
  error?: string
}

type AssignSelectedEmployeesResponse = {
  created?: unknown[]
  skipped?: unknown[]
  error?: string
}

type NudgeResponse = {
  nudgedCount?: number
  error?: string
}

type EmployeeDetailResponse = {
  employee?: EmployeeDetail
  error?: string
}

interface EmployeeManagementPageProps {
  data: EmployeeManagementData
  loadError?: boolean
}

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
]

function getErrorMessage(payload: { error?: string } | null, fallback: string): string {
  return payload?.error ?? fallback
}

export function EmployeeManagementPage({ data, loadError = false }: EmployeeManagementPageProps) {
  const router = useRouter()
  const { selectedIds, toggle, selectAll, clearSelection } = useSelection()
  const [invitedEmployees, setInvitedEmployees] = useState<EmployeeListItem[]>([])
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isAssignSelectedOpen, setIsAssignSelectedOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isAssigningSelected, setIsAssigningSelected] = useState(false)
  const [nudgingIds, setNudgingIds] = useState<string[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null)
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<EmployeeDetail | null>(null)
  const [employeeDetailCache, setEmployeeDetailCache] = useState<Record<string, EmployeeDetail>>({})
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const selectedEmployeeId = selectedEmployee?.id ?? null
  const cachedSelectedEmployeeDetail = selectedEmployeeId
    ? employeeDetailCache[selectedEmployeeId]
    : null

  const employees = useMemo(() => {
    const employeesById = new Map(data.employees.map((employee) => [employee.id, employee]))

    for (const employee of invitedEmployees) {
      if (!employeesById.has(employee.id)) {
        employeesById.set(employee.id, employee)
      }
    }

    return Array.from(employeesById.values())
  }, [data.employees, invitedEmployees])

  const departments = useMemo(() => {
    const values = Array.from(
      new Set([...data.departments, ...invitedEmployees.map((employee) => employee.department)])
    ).sort()

    return values.length > 0 ? values : ["Unassigned"]
  }, [data.departments, invitedEmployees])

  const metricsData = useMemo(
    () => ({
      ...data,
      employees,
      departments,
      metrics: {
        totalEmployees: employees.length,
        averageScore: data.metrics.averageScore,
        pendingCount: employees.filter((employee) => employee.status === "pending").length,
        overdueCount: employees.filter((employee) => employee.status === "overdue").length,
      },
    }),
    [data, departments, employees]
  )

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesDepartment =
          departmentFilter === "all" || employee.department === departmentFilter
        const matchesStatus = statusFilter === "all" || employee.status === statusFilter

        return matchesDepartment && matchesStatus
      }),
    [departmentFilter, employees, statusFilter]
  )

  const departmentFilterOptions = useMemo(
    () => [
      { label: "All departments", value: "all" },
      ...departments.map((department) => ({ label: department, value: department })),
    ],
    [departments]
  )

  const overdueEmployeeIds = employees
    .filter((employee) => employee.status === "overdue")
    .map((employee) => employee.id)

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => selectedIds.has(employee.id)),
    [employees, selectedIds]
  )
  const selectedEmployeeIds = useMemo(
    () => selectedEmployees.map((employee) => employee.id),
    [selectedEmployees]
  )
  const canAssignSelectedEmployees =
    selectedEmployees.length > 0 &&
    data.tests.length > 0 &&
    selectedEmployees.every((employee) => employee.memberStatus === "active")
  const canNudgeSelectedEmployees =
    selectedEmployees.length > 0 &&
    nudgingIds.length === 0 &&
    selectedEmployees.every((employee) => employee.status !== "completed")

  const handleInvite = async (formData: { fullName: string; email: string }) => {
    setIsInviting(true)

    try {
      const response = await fetch("/api/admin/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, department: "Unassigned" }),
      })
      const payload = (await response.json().catch(() => null)) as InviteResponse | null

      if (!response.ok || !payload?.employee) {
        throw new Error(getErrorMessage(payload, "Invite failed"))
      }

      setInvitedEmployees((current) =>
        current.some((employee) => employee.id === payload.employee!.id)
          ? current
          : [...current, payload.employee as EmployeeListItem]
      )
      setIsInviteOpen(false)
      toast.success("Invite sent", {
        description: `${payload.employee.name} was added to the employee list.`,
        position: "bottom-right",
      })
    } catch (error) {
      toast.error("Invite failed", {
        description: error instanceof Error ? error.message : "Try again later.",
        position: "bottom-right",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleAssignSelectedEmployees = async (formData: { testId: string }) => {
    if (!canAssignSelectedEmployees) return

    setIsAssigningSelected(true)

    try {
      const response = await fetch(`/api/admin/tests/${formData.testId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedEmployeeIds,
          deadline: null,
        }),
      })
      const payload = (await response
        .json()
        .catch(() => null)) as AssignSelectedEmployeesResponse | null

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Selected assignment failed"))
      }

      setIsAssignSelectedOpen(false)
      clearSelection()
      toast.success("Selected assignment complete", {
        description: `${payload?.created?.length ?? 0} new assignment${
          payload?.created?.length === 1 ? "" : "s"
        } created. ${payload?.skipped?.length ?? 0} skipped.`,
        position: "bottom-right",
      })
      router.refresh()
    } catch (error) {
      toast.error("Selected assignment failed", {
        description: error instanceof Error ? error.message : "Try again later.",
        position: "bottom-right",
      })
    } finally {
      setIsAssigningSelected(false)
    }
  }

  const handleNudge = async (employeeIds: string[], label: string): Promise<boolean> => {
    setNudgingIds((current) => Array.from(new Set([...current, ...employeeIds])))

    try {
      const response = await fetch("/api/admin/employees/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds,
          reason: label,
          channel: "email",
        }),
      })
      const payload = (await response.json().catch(() => null)) as NudgeResponse | null

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Reminder could not be sent"))
      }

      toast.success("Reminder sent", {
        description: `${payload?.nudgedCount ?? employeeIds.length} employee${
          (payload?.nudgedCount ?? employeeIds.length) === 1 ? "" : "s"
        } nudged by email.`,
        position: "bottom-right",
      })
      return true
    } catch (error) {
      toast.error("Reminder failed", {
        description: error instanceof Error ? error.message : "Try again later.",
        position: "bottom-right",
      })
      return false
    } finally {
      setNudgingIds((current) => current.filter((id) => !employeeIds.includes(id)))
    }
  }

  useEffect(() => {
    if (!isDetailDrawerOpen || !selectedEmployeeId) {
      return
    }

    if (cachedSelectedEmployeeDetail) {
      return
    }

    const controller = new AbortController()

    async function loadEmployeeDetail(employeeId: string) {
      setSelectedEmployeeDetail(null)
      setDetailError(null)
      setIsDetailLoading(true)

      try {
        const response = await fetch(`/api/admin/employees/${employeeId}/detail`, {
          signal: controller.signal,
        })
        const payload = (await response.json().catch(() => null)) as EmployeeDetailResponse | null

        if (!response.ok || !payload?.employee) {
          throw new Error(getErrorMessage(payload, "Employee preview could not be loaded"))
        }

        const employeeDetail = payload.employee

        setSelectedEmployeeDetail(employeeDetail)
        setEmployeeDetailCache((current) =>
          current[employeeId] ? current : { ...current, [employeeId]: employeeDetail }
        )
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setDetailError(error instanceof Error ? error.message : "Try again later.")
      } finally {
        if (!controller.signal.aborted) {
          setIsDetailLoading(false)
        }
      }
    }

    void loadEmployeeDetail(selectedEmployeeId)

    return () => {
      controller.abort()
    }
  }, [cachedSelectedEmployeeDetail, isDetailDrawerOpen, selectedEmployeeId])

  const handleOpenEmployeePreview = (employee: EmployeeListItem) => {
    const cachedDetail = employeeDetailCache[employee.id]

    setSelectedEmployee(employee)
    setSelectedEmployeeDetail(cachedDetail ?? null)
    setDetailError(null)
    setIsDetailLoading(!cachedDetail)
    setIsDetailDrawerOpen(true)
  }

  const handleDetailDrawerOpenChange = (open: boolean) => {
    setIsDetailDrawerOpen(open)

    if (!open) {
      setIsDetailLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="typography-h2">Employees</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            Track employee progress, invite team members, assign training, and send reminders.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={() => setIsInviteOpen(true)}>
            <MailPlus />
            Invite employee
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <EmployeesKpiSection metrics={metricsData.metrics} />
      </div>

      <div className="mt-2">
        <DataTableShell
          icon={Users}
          title="All Employees"
          countLabel={`${filteredEmployees.length} shown`}
        >
          <DataTableBulkActions selectedCount={selectedIds.size}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAssignSelectedEmployees || isAssigningSelected}
              onClick={() => setIsAssignSelectedOpen(true)}
            >
              <Send />
              Assign test
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNudgeSelectedEmployees}
              onClick={async () => {
                const success = await handleNudge(
                  selectedEmployeeIds,
                  "Please complete your assigned training."
                )

                if (success) {
                  clearSelection()
                }
              }}
            >
              <Bell />
              Nudge reminder
            </Button>
          </DataTableBulkActions>
          {loadError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="typography-h3 font-semibold">Employees could not be loaded</p>
              <p className="max-w-md typography-p text-muted-foreground">
                Refresh the page or try again later. No demo fallback data is shown.
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div>
                <p className="typography-h3 font-semibold">No employees yet</p>
                <p className="mt-2 max-w-md typography-p text-muted-foreground">
                  Invite your first employee to start assigning onboarding tests.
                </p>
              </div>
              <Button size="lg" onClick={() => setIsInviteOpen(true)}>
                Invite your first employee
              </Button>
            </div>
          ) : (
            <EmployeesTable
              employees={filteredEmployees}
              nudgingIds={nudgingIds}
              selectedIds={selectedIds}
              onNudge={handleNudge}
              onOpenPreview={handleOpenEmployeePreview}
              onToggleSelected={toggle}
              onSelectAll={selectAll}
              toolbar={
                <>
                  <DataTableFilterSelect
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    options={departmentFilterOptions}
                  />
                  <DataTableFilterSelect
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                    options={STATUS_OPTIONS}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={overdueEmployeeIds.length === 0 || nudgingIds.length > 0}
                    onClick={() =>
                      handleNudge(
                        overdueEmployeeIds,
                        "Please complete your overdue assigned training."
                      )
                    }
                  >
                    <Bell />
                    Nudge all overdue
                  </Button>
                </>
              }
            />
          )}
        </DataTableShell>
      </div>

      <InviteEmployeeModal
        open={isInviteOpen}
        isSubmitting={isInviting}
        onOpenChange={setIsInviteOpen}
        onSubmit={handleInvite}
      />
      <AssignSelectedEmployeesModal
        open={isAssignSelectedOpen}
        selectedCount={selectedEmployees.length}
        tests={data.tests}
        isSubmitting={isAssigningSelected}
        onOpenChange={setIsAssignSelectedOpen}
        onSubmit={handleAssignSelectedEmployees}
      />
      <EmployeeDetailDrawer
        employee={selectedEmployee}
        detail={selectedEmployeeDetail}
        loading={isDetailLoading}
        error={detailError}
        open={isDetailDrawerOpen}
        onOpenChange={handleDetailDrawerOpenChange}
      />
    </div>
  )
}
