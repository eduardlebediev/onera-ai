import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"

interface KpiCardProps {
  label: string
  value: string
  description: string
  icon: LucideIcon
  trend?: ReactNode
  valueColor?: string
}

function getKpiValueLabel(label: string) {
  if (label === "Documents") return "uploaded"
  if (label === "Active Tests") return "active"
  if (label === "Assigned Tests") return "assigned"
  if (label === "Active Employees") return "employees"
  if (label === "Weak Topics") return "detected"
  return ""
}

export function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  valueColor = "text-foreground",
}: KpiCardProps) {
  return (
    <Card className="col-span-12 min-h-28 sm:col-span-6 lg:col-span-2">
      <CardContent className="flex h-full flex-col justify-between px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Icon className="size-5 shrink-0" />
          <span className="truncate text-base font-semibold">{label}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className={cn("text-4xl font-bold tracking-tight", valueColor)}>{value}</span>
          <span className="mb-1 truncate text-sm font-medium text-muted-foreground">
            {getKpiValueLabel(label)}
          </span>
        </div>
        <p
          className={`mt-1 truncate text-sm font-medium ${
            trend ? "text-emerald-600" : "text-muted-foreground"
          }`}
        >
          {trend}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
