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
  size?: "default" | "compact"
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
  size = "default",
}: KpiCardProps) {
  const valueLabel = getKpiValueLabel(label)
  const isCompact = size === "compact"

  return (
    <Card
      className={cn("col-span-12 sm:col-span-6 lg:col-span-2", isCompact ? "min-h-22" : "min-h-28")}
    >
      <CardContent
        className={cn(
          "flex h-full flex-col justify-between",
          isCompact ? "px-4 py-3 sm:px-5" : "px-5 py-4 sm:px-6"
        )}
      >
        <div
          className={cn(
            "text-muted-foreground",
            isCompact ? "flex items-center gap-2.5" : "flex items-center gap-3"
          )}
        >
          <Icon className={cn("shrink-0", isCompact ? "size-4" : "size-5")} />
          <Typography variant="small" as="span" className="truncate text-muted-foreground">
            {label}
          </Typography>
        </div>
        <div className={cn("flex items-baseline gap-2.5", isCompact ? "mt-2" : "mt-3 gap-3")}>
          <Typography
            variant={isCompact ? "h3" : "h2"}
            as="span"
            className={cn(valueColor, isCompact && "font-semibold")}
          >
            {value}
          </Typography>
          {valueLabel ? (
            <Typography variant="small" as="span" className="mb-0.5 truncate text-muted-foreground">
              {valueLabel}
            </Typography>
          ) : null}
        </div>
        <Typography
          variant="small"
          className={cn(
            "truncate",
            isCompact ? "mt-0.5" : "mt-1",
            trend ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {trend}
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}
