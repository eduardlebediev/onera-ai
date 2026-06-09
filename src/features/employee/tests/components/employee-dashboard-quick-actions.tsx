import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { DashboardQuickAction } from "@/features/employee/tests/lib/employee-dashboard-model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeDashboardQuickActionsProps {
  actions: DashboardQuickAction[]
}

export function EmployeeDashboardQuickActions({ actions }: EmployeeDashboardQuickActionsProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="typography-h3 font-semibold">Quick Actions</h2>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant="outline"
              className="h-auto min-h-24 w-full min-w-0 flex-col items-start gap-2 whitespace-normal rounded-xl p-4 text-left"
            >
              <Link href={action.href} className="flex w-full min-w-0 flex-col gap-2">
                <span className="flex w-full min-w-0 items-center justify-between gap-2 text-sm font-semibold">
                  {action.label}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </span>
                <span className="typography-small line-clamp-2 font-normal text-muted-foreground">
                  {action.description}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
