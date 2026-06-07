import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"

interface KpiCardProps {
  label: string
  value: string
  description: string
  icon: LucideIcon
  valueLabel?: string
  trend?: ReactNode
  valueColor?: string
  size?: "default" | "compact"
}

export function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  valueLabel,
  trend,
  valueColor = "text-foreground",
  size = "default",
}: KpiCardProps) {
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
          <span className="typography-small truncate text-muted-foreground">{label}</span>
        </div>
        <div className={cn("flex items-baseline gap-2.5", isCompact ? "mt-2" : "mt-3 gap-3")}>
          <span
            className={cn(isCompact ? "typography-h3 font-semibold" : "typography-h2", valueColor)}
          >
            {value}
          </span>
          {valueLabel ? (
            <span className="typography-small mb-0.5 truncate text-muted-foreground">
              {valueLabel}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "typography-small truncate",
            isCompact ? "mt-0.5" : "mt-1",
            trend ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {trend}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
