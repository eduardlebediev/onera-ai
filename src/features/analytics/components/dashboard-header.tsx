import { Sparkles, Upload } from "lucide-react"

import { Button } from "@/shared/ui/button"

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="typography-h1">Good Morning, Admin</h1>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Button variant="outline" size="lg">
          <Sparkles className="size-4" />
          Create Test
        </Button>
        <Button variant="default" size="lg">
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>
    </div>
  )
}
