"use client"

import { Maximize2, X } from "lucide-react"
import Link from "next/link"

import { EmployeeDetailPage } from "@/features/employees/components/employee-detail-page"
import type { EmployeeListItem } from "@/features/employees/lib/supabase-employees"
import type { EmployeeDetail } from "@/features/employees/lib/supabase-employee-detail"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"

interface EmployeeDetailDrawerProps {
  employee: EmployeeListItem | null
  detail: EmployeeDetail | null
  loading: boolean
  error: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeDetailDrawer({
  employee,
  detail,
  loading,
  error,
  open,
  onOpenChange,
}: EmployeeDetailDrawerProps) {
  const employeeId = detail?.profile.id ?? employee?.id
  const title = detail?.profile.name ?? employee?.name ?? "Employee preview"

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        aria-describedby={undefined}
        className="h-[90vh] overflow-hidden bg-background"
        leftAction={
          employeeId ? (
            <Button asChild variant="ghost" size="icon">
              <Link href={`/admin/employees/${employeeId}`} aria-label="Open full page">
                <Maximize2 className="size-4" />
              </Link>
            </Button>
          ) : null
        }
        rightAction={
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        }
      >
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="typography-h3 font-semibold">Loading employee preview</p>
                <p className="mt-2 typography-p text-muted-foreground">
                  Fetching recent attempts and topic stats.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="typography-h3 font-semibold">Employee preview could not be loaded</p>
                <p className="mt-2 max-w-md typography-p text-muted-foreground">{error}</p>
                {employeeId ? (
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={`/admin/employees/${employeeId}`}>Open full page</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : detail ? (
            <EmployeeDetailPage employee={detail} showBreadcrumbs={false} />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
