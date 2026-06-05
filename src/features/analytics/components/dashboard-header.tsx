import { Sparkles, Upload } from "lucide-react"

import { Button } from "@/shared/ui/button"

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
        Good Morning, Admin
      </h1>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-full border-transparent bg-card/70 px-6 text-sm font-semibold shadow-sm hover:bg-card"
        >
          <Sparkles className="size-4" />
          Create Test
        </Button>
        <Button className="h-11 gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background shadow-sm hover:bg-foreground/90">
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>
    </div>
  )
}
