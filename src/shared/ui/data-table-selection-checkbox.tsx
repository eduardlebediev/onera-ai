"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

interface DataTableSelectionCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  "aria-label": string
  onCheckedChange: (checked: boolean) => void
}

export function DataTableSelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  "aria-label": ariaLabel,
  onCheckedChange,
}: DataTableSelectionCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={(event) => onCheckedChange(event.currentTarget.checked)}
      className={cn(
        "size-4 rounded border border-input accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    />
  )
}
