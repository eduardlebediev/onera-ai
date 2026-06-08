"use client"

import { BarChart3, Clock, FileText, Globe, Info, List, Sparkles, Tag } from "lucide-react"
import Link from "next/link"
import React from "react"

import { type MockDocumentDetail } from "@/data/mock/documents"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { type GenerateTestSettings } from "./generate-test-model"

interface GenerateTestSummaryProps {
  document: MockDocumentDetail
  settings: GenerateTestSettings
  selectedTopicsCount: number
  selectedChunksCount: number
  canPreview: boolean
}

function toCapitalizedLabel(value: string): string {
  if (value.length === 0) {
    return value
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

export function GenerateTestSummary({
  document,
  settings,
  selectedTopicsCount,
  selectedChunksCount,
  canPreview,
}: GenerateTestSummaryProps) {
  const reviewHref = `/tests/review?documentId=${encodeURIComponent(document.id)}`

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border/50 px-6 py-5">
        <CardTitle className="text-base font-semibold">Generation Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          <SummaryRow
            icon={<List className="size-4" />}
            label="Question Count"
            value={settings.questionCount.toString()}
          />
          <SummaryRow
            icon={<BarChart3 className="size-4" />}
            label="Estimated Distribution"
            value="Multiple Choice 70% • True/False 20% • Short Answer 10%"
            valueClassName="text-[11px] md:text-xs"
            stacked
          />
          <SummaryRow
            icon={<BarChart3 className="size-4" />}
            label="Difficulty"
            value={toCapitalizedLabel(settings.difficulty)}
          />
          <SummaryRow
            icon={<Tag className="size-4" />}
            label="Target Role"
            value={settings.targetRole}
          />
          <SummaryRow
            icon={<Tag className="size-4" />}
            label="Selected Topics"
            value={`${selectedTopicsCount} topics`}
          />
          <SummaryRow
            icon={<FileText className="size-4" />}
            label="Selected Chunks"
            value={`${selectedChunksCount} of ${document.chunks.length} chunks`}
          />
          <SummaryRow
            icon={<Globe className="size-4" />}
            label="Language"
            value={settings.language === "en" ? "English" : "German"}
          />
          <SummaryRow
            icon={<Clock className="size-4" />}
            label="Estimated Time"
            value="12–15 min"
          />
        </div>

        <div className="p-6 pt-4">
          <div className="flex gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-muted-foreground dark:bg-blue-900/10">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
            <p>
              A preview will be generated based on your current settings. You can review and adjust
              before finalizing the test.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <Button
          asChild={canPreview}
          disabled={!canPreview}
          className="h-11 w-full rounded-xl bg-foreground text-background"
        >
          {canPreview ? (
            <Link href={reviewHref}>
              <Sparkles className="mr-2 size-4" />
              Generate Test Preview
            </Link>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Generate Test Preview
            </>
          )}
        </Button>
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
