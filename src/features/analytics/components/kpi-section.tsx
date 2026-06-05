import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react"

import type { KpiStat } from "@/data/mock/admin-dashboard"
import { KpiCard } from "@/shared/ui/kpi-card"

const kpiIcons = [FileText, ClipboardList, BarChart2, Users, CheckCircle2, AlertTriangle]

interface KpiSectionProps {
  stats: KpiStat[]
}

export function KpiSection({ stats }: KpiSectionProps) {
  return (
    <>
      {stats.map((stat, index) => {
        const Icon = kpiIcons[index] ?? FileText
        const isScore = stat.label === "Average Score"
        const isWeakTopics = stat.label === "Weak Topics"

        return (
          <KpiCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={Icon}
            trend={isScore ? <TrendingUp className="mr-1 inline size-3" /> : undefined}
            {...(isWeakTopics ? { valueColor: "text-red-500" } : {})}
          />
        )
      })}
    </>
  )
}
