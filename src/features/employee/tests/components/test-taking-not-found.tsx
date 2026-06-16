import Link from "next/link"
import { ArrowLeft, ClipboardList } from "lucide-react"

import { getTranslator } from "@/shared/i18n/get-locale"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

export async function TestTakingNotFound() {
  const { t } = await getTranslator()

  return (
    <div className="page-shell">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card">
          <ClipboardList className="size-4.5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="typography-h1">{t("employee.takeTest.notFound.title")}</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            {t("employee.takeTest.notFound.subtitle")}
          </p>
        </div>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="typography-p text-muted-foreground">
            {t("employee.takeTest.notFound.body")}
          </p>
          <Button asChild variant="outline">
            <Link href="/employee/tests">
              <ArrowLeft className="size-4" />
              {t("employee.takeTest.notFound.backToMyTests")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
