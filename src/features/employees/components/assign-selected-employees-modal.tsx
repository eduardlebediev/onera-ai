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

interface AssignSelectedEmployeesModalProps {
  open: boolean
  selectedCount: number
  tests: AssignableEmployeeTest[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { testId: string }) => Promise<void>
}

export function AssignSelectedEmployeesModal({
  open,
  selectedCount,
  tests,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: AssignSelectedEmployeesModalProps) {
  const [testId, setTestId] = useState(tests[0]?.id ?? "")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ testId })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Assign selected employees</DrawerTitle>
            <DrawerDescription>
              Assign a published test to {selectedCount} selected employee
              {selectedCount === 1 ? "" : "s"}.
            </DrawerDescription>
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800">
              <p className="typography-small">
                Existing assignments are skipped. New assignments start as pending.
              </p>
            </div>
          </div>
          <DrawerFooter className="mt-auto">
            <Button type="submit" disabled={isSubmitting || !testId || selectedCount < 1}>
              {isSubmitting ? "Assigning..." : "Assign test"}
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
