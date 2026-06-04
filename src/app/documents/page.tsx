import { FileText } from "lucide-react"
import { PlaceholderPage } from "@/shared/ui/placeholder-page"

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents"
      description="Upload and manage source documents used to generate quizzes."
      icon={FileText}
    />
  )
}
