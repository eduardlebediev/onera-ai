import Link from "next/link"

import { requireAdminUser } from "@/features/auth/lib/require-auth"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

interface EmployeeDetailPlaceholderProps {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function EmployeeDetailPlaceholder({
  params,
}: EmployeeDetailPlaceholderProps) {
  await requireAdminUser()
  const { id } = await params

  return (
    <div className="page-shell-narrow">
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div>
            <p className="typography-h3 font-semibold">Employee detail coming soon</p>
            <p className="mt-2 max-w-md typography-p text-muted-foreground">
              Full employee profile and history views are out of scope for this feature. Employee
              ID: <span className="font-mono text-foreground">{id}</span>
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/employees">Back to employees</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
