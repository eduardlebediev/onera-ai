"use client"

import { useCallback, useState } from "react"

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const toggle = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  const selectAll = useCallback((ids: Iterable<string>, selected = true) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      for (const id of ids) {
        if (selected) {
          next.add(id)
        } else {
          next.delete(id)
        }
      }

      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return { selectedIds, toggle, selectAll, clearSelection }
}
