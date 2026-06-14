import { Breadcrumbs } from "@/shared/components/breadcrumbs"

interface AssignBreadcrumbProps {
  testId: string
  testTitle: string
  className?: string
}

export function AssignBreadcrumb({ testId, testTitle, className }: AssignBreadcrumbProps) {
  return (
    <Breadcrumbs
      className={className}
      items={[
        { label: "Tests", href: "/admin/tests" },
        { label: testTitle, href: `/admin/tests/${testId}` },
        { label: "Assign" },
      ]}
    />
  )
}
