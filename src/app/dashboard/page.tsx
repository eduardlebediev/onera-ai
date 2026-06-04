import { LayoutDashboard } from "lucide-react"
import { PlaceholderPage } from "@/shared/ui/placeholder-page"

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Overview of key metrics, recent documents, and quiz activity."
      icon={LayoutDashboard}
    />
  )
}
