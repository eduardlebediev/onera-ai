import { Target } from "lucide-react"

import { PlaceholderPage } from "@/shared/ui/placeholder-page"

interface EmployeeTestResultRouteProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeTestResultRoute({ params }: EmployeeTestResultRouteProps) {
  const { id } = await params

  return (
    <PlaceholderPage
      title="Test Results"
      description={`Placeholder for test ${id} results and feedback. The result and AI feedback flow will be implemented next.`}
      icon={Target}
    />
  )
}
