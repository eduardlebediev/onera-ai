import { ClipboardList } from "lucide-react"

import { PlaceholderPage } from "@/shared/ui/placeholder-page"

interface EmployeeTestTakeRouteProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeTestTakeRoute({ params }: EmployeeTestTakeRouteProps) {
  const { id } = await params

  return (
    <PlaceholderPage
      title="Test Taking Flow"
      description={`Placeholder for taking test ${id}. The full employee test-taking flow will be implemented next.`}
      icon={ClipboardList}
    />
  )
}
