"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const PROCESSING_REFRESH_INTERVAL_MS = 4_000

export function DocumentProcessingRefresher({ enabled }: { enabled: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const intervalId = window.setInterval(() => {
      router.refresh()
    }, PROCESSING_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [enabled, router])

  return null
}
