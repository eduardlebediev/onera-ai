"use client"

import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { Input } from "@/shared/ui/input"

interface DataTableToolbarProps {
  search?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  toolbar?: ReactNode
}

export function DataTableToolbar({
  search,
  searchPlaceholder = "Search...",
  onSearchChange,
  toolbar,
}: DataTableToolbarProps) {
  if (!onSearchChange && !toolbar) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border/50 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {onSearchChange ? (
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="bg-background pl-8"
          />
        </div>
      ) : (
        <span />
      )}
      {toolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{toolbar}</div>
      ) : null}
    </div>
  )
}
