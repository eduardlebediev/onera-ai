"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AssignBreadcrumb } from "@/features/tests/components/assign-breadcrumb"
import { AssignEmployeeList } from "@/features/tests/components/assign-employee-list"
import { AssignSettingsPanel } from "@/features/tests/components/assign-settings-panel"
import { AssignSummaryPanel } from "@/features/tests/components/assign-summary-panel"
import { AssignTestContext } from "@/features/tests/components/assign-test-context"
import {
  buildAssignmentSummary,
  canConfirmAssignment,
  enrichEmployeesWithAssignmentStatus,
  filterEmployees,
  formatAssignmentDeadline,
  getDefaultAssignmentSettings,
  type AssignmentSettings,
  type EmployeeFilter,
} from "@/features/tests/lib/assign-employees-model"
import type { ResolvedMockTest } from "@/features/tests/lib/test-source-document"
import {
  mockEmployees,
  mockTestEmployeeAssignments,
  type MockEmployee,
  type TestEmployeeAssignment,
} from "@/features/tests/mock/employees"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface AssignEmployeesPageProps {
  test: ResolvedMockTest
  employees?: MockEmployee[]
  initialAssignments?: TestEmployeeAssignment[]
  source?: "mock" | "supabase"
}

interface SuccessState {
  assignedCount: number
  deadline: string
}

export function AssignEmployeesPage({
  test,
  employees = mockEmployees,
  initialAssignments = mockTestEmployeeAssignments,
  source = "mock",
}: AssignEmployeesPageProps) {
  const [assignments, setAssignments] = useState<TestEmployeeAssignment[]>(initialAssignments)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [filter, setFilter] = useState<EmployeeFilter>("all")
  const [settings, setSettings] = useState<AssignmentSettings>(getDefaultAssignmentSettings())
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const employeesWithStatus = useMemo(
    () => enrichEmployeesWithAssignmentStatus(employees, assignments, test.id),
    [assignments, employees, test.id]
  )

  const visibleEmployees = useMemo(
    () => filterEmployees(employeesWithStatus, filter),
    [employeesWithStatus, filter]
  )

  const summary = useMemo(
    () => buildAssignmentSummary(selectedEmployeeIds, assignments, test.id),
    [selectedEmployeeIds, assignments, test.id]
  )

  const handleToggleEmployee = (employeeId: string) => {
    const employee = employeesWithStatus.find((item) => item.id === employeeId)
    if (employee?.assignmentStatus !== "not_assigned") return

    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    )
  }

  const handleSelectAllVisible = () => {
    const visibleIds = visibleEmployees
      .filter((employee) => employee.assignmentStatus === "not_assigned")
      .map((employee) => employee.id)
    setSelectedEmployeeIds((current) => Array.from(new Set([...current, ...visibleIds])))
  }

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(visibleEmployees.map((employee) => employee.id))
    setSelectedEmployeeIds((current) => current.filter((id) => !visibleIds.has(id)))
  }

  const handleAssign = async () => {
    if (!canConfirmAssignment(selectedEmployeeIds.length, settings.deadline) || isAssigning) return

    setIsAssigning(true)
    setErrorMessage(null)

    if (source === "supabase") {
      try {
        const response = await fetch(`/api/admin/tests/${test.id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: selectedEmployeeIds,
            deadline: new Date(`${settings.deadline}T00:00:00.000Z`).toISOString(),
          }),
        })

        const payload = (await response.json().catch(() => null)) as {
          error?: string
          created?: Array<{ userId: string; status: TestEmployeeAssignment["status"] }>
        } | null

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to assign test")
        }

        const createdAssignments = payload?.created ?? []
        const assignedCount = createdAssignments.length

        setAssignments((current) => [
          ...current,
          ...createdAssignments.map((assignment) => ({
            testId: test.id,
            employeeId: assignment.userId,
            status: assignment.status,
          })),
        ])
        setSuccessState({
          assignedCount,
          deadline: settings.deadline,
        })
        toast.success(
          `${assignedCount} employee${assignedCount === 1 ? "" : "s"} assigned successfully`
        )
        setSelectedEmployeeIds([])
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to assign test")
        toast.error("Assignment failed. Try again.")
      } finally {
        setIsAssigning(false)
      }

      return
    }

    window.setTimeout(() => {
      const assignedCount = selectedEmployeeIds.length

      setAssignments((current) => {
        const next = [...current]

        for (const employeeId of selectedEmployeeIds) {
          const existingIndex = next.findIndex(
            (item) => item.testId === test.id && item.employeeId === employeeId
          )

          if (existingIndex === -1) {
            next.push({
              testId: test.id,
              employeeId,
              status: "not_started",
            })
          }
        }

        return next
      })

      setSuccessState({
        assignedCount,
        deadline: settings.deadline,
      })
      toast.success(
        `${assignedCount} employee${assignedCount === 1 ? "" : "s"} assigned successfully`
      )
      setIsAssigning(false)
    }, 700)
  }

  const handleAssignMore = () => {
    setSuccessState(null)
    setSelectedEmployeeIds([])
    setSettings(getDefaultAssignmentSettings())
    setErrorMessage(null)
  }

  if (successState) {
    return (
      <div className="page-shell-narrow">
        <AssignBreadcrumb testId={test.id} testTitle={test.title} className="mb-6" />

        <Card>
          <CardContent className="space-y-6 py-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h1 className="typography-h2">Test assigned successfully</h1>
              <p className="mt-2 typography-p text-muted-foreground">
                {successState.assignedCount} employee
                {successState.assignedCount === 1 ? "" : "s"} assigned to{" "}
                <span className="font-medium text-foreground">{test.title}</span>.
              </p>
            </div>

            <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-4 text-left">
              <div className="flex justify-between gap-4">
                <span className="typography-small text-muted-foreground">Test</span>
                <span className="text-sm font-medium text-foreground">{test.title}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="typography-small text-muted-foreground">Assigned employees</span>
                <span className="text-sm font-medium text-foreground">
                  {successState.assignedCount}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="typography-small text-muted-foreground">Deadline</span>
                <span className="text-sm font-medium text-foreground">
                  {formatAssignmentDeadline(successState.deadline)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/employee/tests">View Employee Tests</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/admin/tests/${test.id}`}>Back to Test Detail</Link>
              </Button>
              <Button type="button" variant="outline" onClick={handleAssignMore}>
                Assign More Employees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-shell-narrow">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="typography-h1">Assign to Employees</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            Select employees, set a deadline, and confirm the assignment.
          </p>
          <AssignBreadcrumb testId={test.id} testTitle={test.title} className="mt-4" />
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href={`/admin/tests/${test.id}`}>Back to Test Detail</Link>
        </Button>
      </div>

      <div className="space-y-2">
        <AssignTestContext test={test} />

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <AssignEmployeeList
              employees={visibleEmployees}
              selectedEmployeeIds={selectedEmployeeIds}
              filter={filter}
              onFilterChange={setFilter}
              onToggleEmployee={handleToggleEmployee}
              onSelectAllVisible={handleSelectAllVisible}
              onDeselectAllVisible={handleDeselectAllVisible}
            />
          </div>

          <div className="space-y-2">
            <AssignSettingsPanel
              settings={settings}
              selectedCount={selectedEmployeeIds.length}
              onSettingsChange={setSettings}
            />
            <AssignSummaryPanel
              testTitle={test.title}
              deadline={settings.deadline}
              summary={summary}
              isAssigning={isAssigning}
              onAssign={handleAssign}
            />
            {errorMessage ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="typography-small text-destructive">{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
