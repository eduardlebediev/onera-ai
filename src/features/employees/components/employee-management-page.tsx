"use client"

import { Bell, CheckCircle2, Clock, ClipboardList, MailPlus, Send, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { EmployeeDetailDrawer } from "@/features/employees/components/employee-detail-drawer"
import { EmployeesTable } from "@/features/employees/components/employees-table"
import type { EmployeeDetail } from "@/features/employees/lib/supabase-employee-detail"
import type {
  AssignableEmployeeTest,
  EmployeeListItem,
  EmployeeManagementData,
  EmployeeProgressStatus,
} from "@/features/employees/lib/supabase-employees"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTableShell } from "@/shared/ui/data-table-shell"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer"
import { Input } from "@/shared/ui/input"

type StatusFilter = "all" | EmployeeProgressStatus

type InviteResponse = {
  employee?: EmployeeListItem
  error?: string
}

type BulkAssignResponse = {
  testTitle?: string
  targetCount?: number
  createdCount?: number
  skippedCount?: number
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

function formatScore(score: number | null): string {
  return typeof score === "number" ? `${score}%` : "--"
}

function getErrorMessage(payload: { error?: string } | null, fallback: string): string {
  return payload?.error ?? fallback
}

function EmployeeKpiCards({ data }: { data: EmployeeManagementData }) {
  const cards = [
    {
      label: "Total employees",
      value: String(data.metrics.totalEmployees),
      description: "Team members in this organization",
      icon: Users,
    },
    {
      label: "Avg score",
      value: formatScore(data.metrics.averageScore),
      description: "Across completed attempts",
      icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: String(data.metrics.pendingCount),
      description: "Need to finish assigned tests",
      icon: ClipboardList,
    },
    {
      label: "Overdue",
      value: String(data.metrics.overdueCount),
      description: "Past assignment deadline",
      icon: Clock,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex min-h-28 flex-col justify-between px-5 py-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <card.icon className="size-5 shrink-0" />
              <span className="typography-small">{card.label}</span>
            </div>
            <div>
              <p className="typography-h2">{card.value}</p>
              <p className="typography-small text-muted-foreground">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DepartmentSelect({
  departments,
  value,
  onChange,
  includeAll = true,
}: {
  departments: string[]
  value: string
  onChange: (value: string) => void
  includeAll?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-lg border border-input bg-input px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {includeAll ? <option value="all">All departments</option> : null}
      {departments.map((department) => (
        <option key={department} value={department}>
          {department}
        </option>
      ))}
    </select>
  )
}

function InviteEmployeeDrawer({
  open,
  departments,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  departments: string[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { fullName: string; email: string; department: string }) => Promise<void>
}) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState(departments[0] ?? "Unassigned")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ fullName, email, department })
    setFullName("")
    setEmail("")
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Invite employee</DrawerTitle>
            <DrawerDescription>
              Create an employee invite and send onboarding details.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Full name</span>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Alex Morgan"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="alex@company.com"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Department</span>
              <DepartmentSelect
                departments={departments}
                value={department}
                includeAll={false}
                onChange={setDepartment}
              />
            </label>
          </div>
          <DrawerFooter className="mt-auto">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Inviting..." : "Invite & send onboarding"}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function BulkAssignDrawer({
  open,
  departments,
  tests,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  departments: string[]
  tests: AssignableEmployeeTest[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { testId: string; department: string | null }) => Promise<void>
}) {
  const [testId, setTestId] = useState(tests[0]?.id ?? "")
  const [department, setDepartment] = useState("all")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({
      testId,
      department: department === "all" ? null : department,
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Bulk assign</DrawerTitle>
            <DrawerDescription>Assign a published test to an entire department.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Assessment module</span>
              <select
                value={testId}
                onChange={(event) => setTestId(event.target.value)}
                required
                className="h-8 w-full rounded-lg border border-input bg-input px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {tests.length === 0 ? <option value="">No published tests available</option> : null}
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="typography-small font-medium">Target department</span>
              <DepartmentSelect
                departments={departments}
                value={department}
                onChange={setDepartment}
              />
            </label>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800">
              <p className="typography-small">
                New assignments start as pending. Existing assignments and completed attempts are
                preserved.
              </p>
            </div>
          </div>
          <DrawerFooter className="mt-auto">
            <Button type="submit" disabled={isSubmitting || !testId}>
              {isSubmitting ? "Assigning..." : "Execute assignment"}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export function EmployeeManagementPage({ data, loadError = false }: EmployeeManagementPageProps) {
  const router = useRouter()
  const [invitedEmployees, setInvitedEmployees] = useState<EmployeeListItem[]>([])
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)
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

  const overdueEmployeeIds = employees
    .filter((employee) => employee.status === "overdue")
    .map((employee) => employee.id)

  const handleInvite = async (formData: {
    fullName: string
    email: string
    department: string
  }) => {
    setIsInviting(true)

    try {
      const response = await fetch("/api/admin/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

  const handleBulkAssign = async (formData: { testId: string; department: string | null }) => {
    setIsBulkAssigning(true)

    try {
      const response = await fetch("/api/admin/tests/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const payload = (await response.json().catch(() => null)) as BulkAssignResponse | null

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Bulk assignment failed"))
      }

      setIsBulkAssignOpen(false)
      toast.success("Bulk assignment complete", {
        description: `${payload?.createdCount ?? 0} new assignment${
          payload?.createdCount === 1 ? "" : "s"
        } created for ${payload?.testTitle ?? "the selected test"}.`,
        position: "bottom-right",
      })
      router.refresh()
    } catch (error) {
      toast.error("Bulk assignment failed", {
        description: error instanceof Error ? error.message : "Try again later.",
        position: "bottom-right",
      })
    } finally {
      setIsBulkAssigning(false)
    }
  }

  const handleNudge = async (employeeIds: string[], label: string) => {
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
    } catch (error) {
      toast.error("Reminder failed", {
        description: error instanceof Error ? error.message : "Try again later.",
        position: "bottom-right",
      })
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
          <Button className="rounded-full" onClick={() => setIsInviteOpen(true)}>
            <MailPlus />
            Invite employee
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setIsBulkAssignOpen(true)}
          >
            <Send />
            Bulk assign
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <EmployeeKpiCards data={metricsData} />
      </div>

      <div className="mt-6">
        <DataTableShell
          icon={Users}
          title="All Employees"
          countLabel={`${filteredEmployees.length} shown`}
        >
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
              <Button className="rounded-full" onClick={() => setIsInviteOpen(true)}>
                Invite your first employee
              </Button>
            </div>
          ) : (
            <EmployeesTable
              employees={filteredEmployees}
              nudgingIds={nudgingIds}
              onNudge={handleNudge}
              onOpenPreview={handleOpenEmployeePreview}
              toolbar={
                <>
                  <DepartmentSelect
                    departments={departments}
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-8 rounded-lg border border-input bg-input px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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

      <InviteEmployeeDrawer
        open={isInviteOpen}
        departments={departments}
        isSubmitting={isInviting}
        onOpenChange={setIsInviteOpen}
        onSubmit={handleInvite}
      />
      <BulkAssignDrawer
        open={isBulkAssignOpen}
        departments={departments}
        tests={data.tests}
        isSubmitting={isBulkAssigning}
        onOpenChange={setIsBulkAssignOpen}
        onSubmit={handleBulkAssign}
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
