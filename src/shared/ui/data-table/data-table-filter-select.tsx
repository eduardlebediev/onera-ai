"use client"

import { Filter } from "lucide-react"

import { cn } from "@/lib/utils"

export type DataTableFilterSelectOption = {
  label: string
  value: string
}

interface DataTableFilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: DataTableFilterSelectOption[]
  className?: string
}

const selectClassName =
  "h-8 w-full appearance-none rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function DataTableFilterSelect({
  value,
  onChange,
  options,
  className,
}: DataTableFilterSelectProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Filter className="pointer-events-none absolute top-2 left-3 size-4 text-muted-foreground" />
    </div>
  )
}
