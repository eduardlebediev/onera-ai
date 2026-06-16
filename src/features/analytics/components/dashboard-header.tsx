"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"

import { DocumentUploadButton } from "@/features/documents/components/document-upload-button"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Button } from "@/shared/ui/button"

interface DashboardHeaderProps {
  adminName: string
  generateTestHref: string
}

export function DashboardHeader({ adminName, generateTestHref }: DashboardHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="typography-label text-muted-foreground">{t("common.welcomeBack")}</p>
        <h1 className="typography-h1">{adminName}</h1>
        <p className="mt-1 typography-p text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <DocumentUploadButton
          className="shrink-0"
          iconClassName="size-4"
          showInlineError={false}
          size="lg"
          variant="outline"
        />
        <Button variant="default" size="lg" asChild>
          <Link href={generateTestHref}>
            <Sparkles className="size-4" />
            {t("admin.dashboard.generateTest")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
