import { ClipboardList } from "lucide-react"
import { PlaceholderPage } from "@/shared/ui/placeholder-page"

export default function TestsPage() {
  return (
    <PlaceholderPage
      title="Tests"
      description="Create, review, and publish AI-generated quizzes for your team."
      icon={ClipboardList}
    />
  )
}
