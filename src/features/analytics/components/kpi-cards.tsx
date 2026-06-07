import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react"
import type { ReactNode } from "react"

import type { KpiStat } from "@/data/mock/admin-dashboard"
import { KpiCard } from "@/shared/ui/kpi-card"

interface KpiMeta {
  icon: typeof FileText
  valueLabel: string
  trend?: ReactNode
  valueColor?: string
}

const KPI_META_BY_LABEL: Record<string, KpiMeta> = {
  Documents: { icon: FileText, valueLabel: "uploaded" },
  "Active Tests": { icon: ClipboardList, valueLabel: "active" },
  "Assigned Tests": { icon: BarChart2, valueLabel: "assigned" },
  "Active Employees": { icon: Users, valueLabel: "employees" },
  "Average Score": {
    icon: CheckCircle2,
    valueLabel: "",
    trend: <TrendingUp className="mr-1 inline size-3" />,
  },
  "Weak Topics": { icon: AlertTriangle, valueLabel: "detected", valueColor: "text-red-500" },
}

interface KpiCardsProps {
  stats: KpiStat[]
}

export function KpiCards({ stats }: KpiCardsProps) {
  return (
    <>
      {stats.map((stat) => {
        const meta = KPI_META_BY_LABEL[stat.label] ?? { icon: FileText, valueLabel: "" }
        const Icon = meta.icon

        return (
          <KpiCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={Icon}
            valueLabel={meta.valueLabel}
            trend={meta.trend}
            valueColor={meta.valueColor}
          />
        )
      })}
    </>
  )
}
