"use client"

import { BarChart3, Clock, FileText, Globe, List, Tag } from "lucide-react"
import React from "react"

import { type DocumentDetail } from "@/features/documents/types/document"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useTranslation } from "@/shared/i18n/use-translation"
import { formatTargetRoleLabel, type GenerateTestSettings } from "./generate-test-model"

interface GenerateTestSummaryProps {
  selectedDocuments: DocumentDetail[]
  settings: GenerateTestSettings
}

export function GenerateTestSummary({ selectedDocuments, settings }: GenerateTestSummaryProps) {
  const { locale, t } = useTranslation()

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border/50 px-6 py-5">
        <CardTitle className="text-base font-semibold">
          {t("documents.generateTest.summary.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          <SummaryRow
            icon={<List className="size-4" />}
            label={t("documents.generateTest.summary.questionCount")}
            value={settings.questionCount.toString()}
          />
          <SummaryRow
            icon={<BarChart3 className="size-4" />}
            label={t("documents.generateTest.summary.difficulty")}
            value={t(`common.difficulty.${settings.difficulty}`)}
          />
          <SummaryRow
            icon={<FileText className="size-4" />}
            label={t("documents.generateTest.summary.selectedDocuments")}
            value={t("common.documentCount", {
              count: selectedDocuments.length,
              plural: selectedDocuments.length === 1 ? "" : "s",
            })}
          />
          <SummaryRow
            icon={<Globe className="size-4" />}
            label={t("documents.generateTest.summary.contentLanguage")}
            value={t(`common.language.${locale}`)}
          />
          <SummaryRow
            icon={<Clock className="size-4" />}
            label={t("documents.generateTest.summary.estimatedTime")}
            value={t("common.estimatedTime")}
          />
          <SummaryRow
            icon={<Tag className="size-4" />}
            label={t("documents.generateTest.summary.targetRole")}
            value={formatTargetRoleLabel(settings.targetRole, t)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface SummaryRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
