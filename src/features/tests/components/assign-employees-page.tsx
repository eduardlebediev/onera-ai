"use client"

import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

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
  type TestEmployeeAssignment,
} from "@/features/tests/mock/employees"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface AssignEmployeesPageProps {
  test: ResolvedMockTest
}

interface SuccessState {
  assignedCount: number
  deadline: string
}

export function AssignEmployeesPage({ test }: AssignEmployeesPageProps) {
  const [assignments, setAssignments] = useState<TestEmployeeAssignment[]>(
    mockTestEmployeeAssignments
  )
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [filter, setFilter] = useState<EmployeeFilter>("all")
  const [settings, setSettings] = useState<AssignmentSettings>(getDefaultAssignmentSettings())
  const [successState, setSuccessState] = useState<SuccessState | null>(null)

  const employeesWithStatus = useMemo(
    () => enrichEmployeesWithAssignmentStatus(mockEmployees, assignments, test.id),
    [assignments, test.id]
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
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    )
  }

  const handleSelectAllVisible = () => {
    const visibleIds = visibleEmployees.map((employee) => employee.id)
    setSelectedEmployeeIds((current) => Array.from(new Set([...current, ...visibleIds])))
  }

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(visibleEmployees.map((employee) => employee.id))
    setSelectedEmployeeIds((current) => current.filter((id) => !visibleIds.has(id)))
  }

  const handleAssign = () => {
    if (!canConfirmAssignment(selectedEmployeeIds.length, settings.deadline)) return

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
      assignedCount: selectedEmployeeIds.length,
      deadline: settings.deadline,
    })
  }

  const handleAssignMore = () => {
    setSuccessState(null)
    setSelectedEmployeeIds([])
    setSettings(getDefaultAssignmentSettings())
  }

  if (successState) {
    return (
      <div className="page-shell max-w-3xl">
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
                <Link href={`/tests/${test.id}`}>Back to Test Detail</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/employee/tests">View Employee Tests</Link>
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
    <div className="page-shell max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <AssignBreadcrumb testId={test.id} testTitle={test.title} className="mb-4" />
          <h1 className="typography-h1">Assign to Employees</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            Select employees, set a deadline, and confirm the assignment.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href={`/tests/${test.id}`}>Back to Test Detail</Link>
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
              onAssign={handleAssign}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
