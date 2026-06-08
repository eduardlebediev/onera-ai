"use client"

import { AlertTriangle, Check } from "lucide-react"

import {
  EMPLOYEE_FILTER_OPTIONS,
  formatAssignmentStatus,
  type EmployeeFilter,
  type EmployeeWithAssignmentStatus,
} from "@/features/tests/lib/assign-employees-model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/lib/utils"

interface AssignEmployeeListProps {
  employees: EmployeeWithAssignmentStatus[]
  selectedEmployeeIds: string[]
  filter: EmployeeFilter
  onFilterChange: (filter: EmployeeFilter) => void
  onToggleEmployee: (employeeId: string) => void
  onSelectAllVisible: () => void
  onDeselectAllVisible: () => void
}

function AssignmentStatusBadge({
  status,
}: {
  status: EmployeeWithAssignmentStatus["assignmentStatus"]
}) {
  const label = formatAssignmentStatus(status)

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
      >
        {label}
      </Badge>
    )
  }

  if (status === "in_progress") {
    return (
      <Badge
        variant="outline"
        className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400"
      >
        {label}
      </Badge>
    )
  }

  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
      >
        {label}
      </Badge>
    )
  }

  if (status === "not_started") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {label}
      </Badge>
    )
  }

  return <Badge variant="secondary">{label}</Badge>
}

export function AssignEmployeeList({
  employees,
  selectedEmployeeIds,
  filter,
  onFilterChange,
  onToggleEmployee,
  onSelectAllVisible,
  onDeselectAllVisible,
}: AssignEmployeeListProps) {
  const allVisibleSelected =
    employees.length > 0 && employees.every((employee) => selectedEmployeeIds.includes(employee.id))
  const hasVisibleSelected = employees.some((employee) => selectedEmployeeIds.includes(employee.id))

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Select Employees</CardTitle>
            <p className="mt-1 typography-small text-muted-foreground">
              Choose employees to assign this test to.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSelectAllVisible}>
              Select all visible
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDeselectAllVisible}
              disabled={!hasVisibleSelected}
            >
              Deselect visible
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {EMPLOYEE_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              className={
                filter === option.value
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : ""
              }
              onClick={() => onFilterChange(option.value)}
              aria-pressed={filter === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 px-4">
                  <button
                    type="button"
                    onClick={allVisibleSelected ? onDeselectAllVisible : onSelectAllVisible}
                    className={cn(
                      "flex size-5 items-center justify-center rounded border transition-colors",
                      allVisibleSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                    aria-label={allVisibleSelected ? "Deselect all visible" : "Select all visible"}
                  >
                    {allVisibleSelected && <Check className="size-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Employee
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Department
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Completed
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Avg Score
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee) => {
                  const isSelected = selectedEmployeeIds.includes(employee.id)

                  return (
                    <TableRow
                      key={employee.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected && "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={() => onToggleEmployee(employee.id)}
                    >
                      <TableCell className="px-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onToggleEmployee(employee.id)
                          }}
                          className={cn(
                            "flex size-5 items-center justify-center rounded border transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          )}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? "Deselect" : "Select"} ${employee.name}`}
                        >
                          {isSelected && <Check className="size-3" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{employee.name}</p>
                          <p className="typography-small text-muted-foreground">{employee.email}</p>
                          <p className="typography-small text-muted-foreground">{employee.role}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{employee.department}</TableCell>
                      <TableCell>
                        <AssignmentStatusBadge status={employee.assignmentStatus} />
                      </TableCell>
                      <TableCell className="text-sm">{employee.completedTestsCount}</TableCell>
                      <TableCell className="text-sm">
                        {employee.completedTestsCount > 0 ? `${employee.averageScore}%` : "—"}
                      </TableCell>
                      <TableCell>
                        {employee.riskLevel === "at_risk" ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400"
                          >
                            <AlertTriangle className="mr-1 size-3" />
                            At risk
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
                          >
                            On track
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="typography-p text-muted-foreground">
                      No employees match the current filter.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
