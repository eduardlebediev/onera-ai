import { AlertCircle, CheckCircle2 } from "lucide-react"

import type { PublishReadinessCheck } from "@/features/tests/lib/publish-test-model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/lib/utils"

interface PublishReadinessCardProps {
  checks: PublishReadinessCheck[]
  blockReason?: string
}

function ReadinessCheckItem({ check }: { check: PublishReadinessCheck }) {
  const isReady = check.status === "ready"
  const Icon = isReady ? CheckCircle2 : AlertCircle

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 px-4 py-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          isReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
        )}
      />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{check.label}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              isReady
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            )}
          >
            {isReady ? "Ready" : "Needs attention"}
          </span>
        </div>
        <p className="typography-small text-muted-foreground">{check.helperText}</p>
      </div>
    </li>
  )
}

export function PublishReadinessCard({ checks, blockReason }: PublishReadinessCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {checks.map((check) => (
            <ReadinessCheckItem key={check.id} check={check} />
          ))}
        </ul>

        {blockReason ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-900/20">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="typography-small text-amber-800 dark:text-amber-300">{blockReason}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
