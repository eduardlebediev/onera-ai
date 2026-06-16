"use client"

import { BarChart3, Clock, FileText, Globe, Info, List, Tag } from "lucide-react"
import React from "react"

import { type DocumentDetail } from "@/features/documents/types/document"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { useTranslation } from "@/shared/i18n/use-translation"
import { type GenerateTestSettings } from "./generate-test-model"

interface GenerateTestSummaryProps {
  selectedDocuments: DocumentDetail[]
  settings: GenerateTestSettings
  selectedTopicsCount: number
  selectedChunksCount: number
}

export function GenerateTestSummary({
  selectedDocuments,
  settings,
  selectedTopicsCount,
  selectedChunksCount,
}: GenerateTestSummaryProps) {
  const { locale, t } = useTranslation()
  const totalChunks = selectedDocuments.reduce(
    (count, document) => count + document.chunks.length,
    0
  )

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
            label={t("documents.generateTest.summary.estimatedDistribution")}
            value={t("common.estimatedDistribution")}
            valueClassName="text-[11px] md:text-xs"
            stacked
          />
          <SummaryRow
            icon={<BarChart3 className="size-4" />}
            label={t("documents.generateTest.summary.difficulty")}
            value={t(`common.difficulty.${settings.difficulty}`)}
          />
          <SummaryRow
            icon={<Tag className="size-4" />}
            label={t("documents.generateTest.summary.targetRole")}
            value={settings.targetRole}
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
            icon={<Tag className="size-4" />}
            label={t("documents.generateTest.summary.selectedTopics")}
            value={t("common.topics", { count: selectedTopicsCount, plural: "s" })}
          />
          <SummaryRow
            icon={<FileText className="size-4" />}
            label={t("documents.generateTest.summary.selectedChunks")}
            value={t("documents.generateTest.summary.selectedChunksOf", {
              selected: selectedChunksCount,
              total: totalChunks,
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
        </div>

        <div className="p-6 pt-4">
          <div className="flex gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-muted-foreground dark:bg-blue-900/10">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
            <p>{t("documents.generateTest.summary.previewHint")}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <p className="w-full text-center typography-small text-muted-foreground">
          {t("documents.generateTest.summary.footerHint")}
        </p>
      </CardFooter>
    </Card>
  )
}

interface SummaryRowProps {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
  stacked?: boolean
}

function SummaryRow({ icon, label, value, valueClassName, stacked }: SummaryRowProps) {
  if (stacked) {
    return (
      <div className="flex items-start gap-4 px-6 py-4">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className={`font-medium text-muted-foreground ${valueClassName || "text-sm"}`}>
            {value}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className={`text-right font-medium text-foreground ${valueClassName || "text-sm"}`}>
        {value}
      </span>
    </div>
  )
}
