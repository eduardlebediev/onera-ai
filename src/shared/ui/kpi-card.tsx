import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"
import { Typography } from "@/shared/ui/typography"

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
          <Typography variant="small" as="span" className="truncate text-muted-foreground">
            {label}
          </Typography>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <Typography variant="h2" as="span" className={cn(valueColor)}>
            {value}
          </Typography>
          <Typography variant="small" as="span" className="mb-1 truncate text-muted-foreground">
            {getKpiValueLabel(label)}
          </Typography>
        </div>
        <Typography
          variant="small"
          className={cn("mt-1 truncate", trend ? "text-emerald-600" : "text-muted-foreground")}
        >
          {trend}
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}
