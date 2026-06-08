import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface DataTableShellProps {
  icon?: LucideIcon
  title: string
  countLabel?: string
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

export function DataTableShell({
  icon: Icon,
  title,
  countLabel,
  toolbar,
  children,
  className,
}: DataTableShellProps) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-5 text-muted-foreground" /> : null}
          <h3 className="typography-h3 font-semibold">{title}</h3>
          {countLabel ? (
            <p className="typography-small text-muted-foreground ml-2">{countLabel}</p>
          ) : null}
        </div>
        {toolbar ? <div className="w-full sm:w-auto">{toolbar}</div> : null}
      </div>
      {children}
    </div>
  )
}
