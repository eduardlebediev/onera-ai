import { BookOpen } from "lucide-react"
import { PlaceholderPage } from "@/shared/ui/placeholder-page"

export default function MyTestsPage() {
  return (
    <PlaceholderPage
      title="My Tests"
      description="View and complete quizzes assigned to you by your administrator."
      icon={BookOpen}
    />
  )
}
