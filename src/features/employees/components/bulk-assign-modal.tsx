"use client"

import { FormEvent, useState } from "react"

import type { AssignableEmployeeTest } from "@/features/employees/lib/supabase-employees"
import { Button } from "@/shared/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer"

import { DepartmentSelect } from "./department-select"

interface BulkAssignModalProps {
  open: boolean
  departments: string[]
  tests: AssignableEmployeeTest[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { testId: string; department: string | null }) => Promise<void>
}

export function BulkAssignModal({
  open,
  departments,
  tests,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: BulkAssignModalProps) {
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
