"use client"

import { AlertTriangle, Loader2, RotateCcw, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { type DocumentDetail } from "@/features/documents/types/document"
import { resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { GenerateTestForm } from "@/features/documents/components/generate-test-form"
import {
  canGenerateTest,
  getDefaultGenerateTestSettings,
  getGenerateBlockReason,
  MAX_SELECTABLE_DOCUMENTS,
  type GenerateTestTargetEmployee,
  type GenerateTestSettings,
} from "@/features/documents/components/generate-test-model"
import { GenerateTestSummary } from "@/features/documents/components/generate-test-summary"
import { MultiDocumentSelector } from "@/features/documents/components/multi-document-selector"
import { generateTestFromDocument } from "@/features/tests/lib/generated-test-api-client"
import { saveGeneratedTestDraft } from "@/features/tests/lib/generated-test-session"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Button } from "@/shared/ui/button"
import { useTranslation } from "@/shared/i18n/use-translation"

interface GenerateTestSetupProps {
  document: DocumentDetail
  routeDocumentId: string
  selectableDocuments: DocumentDetail[]
  targetEmployees: GenerateTestTargetEmployee[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function GenerateTestSetup({
  document,
  routeDocumentId,
  selectableDocuments,
  targetEmployees,
}: GenerateTestSetupProps) {
  const router = useRouter()
  const { locale, t } = useTranslation()
  const documentsById = useMemo(() => {
    const map = new Map<string, DocumentDetail>()

    for (const item of selectableDocuments) {
      map.set(item.id, item)
    }

    map.set(document.id, document)

    return map
  }, [document, selectableDocuments])

  const initialDocumentId = document.id
  const defaultSettings = useMemo(() => getDefaultGenerateTestSettings(document, t), [document, t])

  const [settings, setSettings] = useState<GenerateTestSettings>(defaultSettings)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([initialDocumentId])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [hasAcceptedOldVersion, setHasAcceptedOldVersion] = useState(
    document.isLatestVersion !== false
  )

  const selectedDocuments = useMemo(
    () =>
      selectedDocumentIds.flatMap((documentId) => {
        const selected = documentsById.get(documentId)
        return selected ? [selected] : []
      }),
    [documentsById, selectedDocumentIds]
  )

  const firstInvalidSelectedDocument = selectedDocuments.find(
    (selectedDocument) => !canGenerateTest(selectedDocument)
  )
  const isGeneratable = selectedDocuments.length > 0 && !firstInvalidSelectedDocument
  const isLatestVersion = document.isLatestVersion !== false
  const latestDocumentId = document.latestDocumentId ?? document.id
  const canPreview =
    isGeneratable && selectedDocumentIds.length > 0 && (isLatestVersion || hasAcceptedOldVersion)

  const handleSettingsChange = useCallback((updates: Partial<GenerateTestSettings>) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...updates }))
  }, [])

  const handleToggleDocument = useCallback(
    (documentId: string) => {
      setSelectedDocumentIds((currentIds) => {
        if (currentIds.includes(documentId)) {
          if (documentId === initialDocumentId || currentIds.length === 1) {
            return currentIds
          }

          return currentIds.filter((id) => id !== documentId)
        }

        if (currentIds.length >= MAX_SELECTABLE_DOCUMENTS) {
          return currentIds
        }

        return [...currentIds, documentId]
      })
    },
    [initialDocumentId]
  )

  const handleReset = useCallback(() => {
    setSettings(defaultSettings)
    setSelectedDocumentIds([initialDocumentId])
    setGenerationError(null)
  }, [defaultSettings, initialDocumentId])

  const handleGeneratePreview = useCallback(async () => {
    if (!canPreview || isGenerating) return

    setGenerationError(null)

    const apiDocumentIds = selectedDocumentIds.flatMap((documentId) => {
      const apiId = resolveApiDocumentId(documentId) ?? (isUuid(documentId) ? documentId : null)
      return apiId ? [apiId] : []
    })

    if (apiDocumentIds.length === 0) {
      setGenerationError(t("documents.generateTest.selectSupabaseDocument"))
      return
    }

    setIsGenerating(true)

    try {
      const response = await generateTestFromDocument({
        documentIds: apiDocumentIds,
        questionCount: settings.questionCount,
        difficulty: settings.difficulty,
        language: locale,
        targetRole: settings.targetRole,
        targetEmployeeIds: settings.targetEmployeeIds,
      })

      saveGeneratedTestDraft(response)

      const reviewQuery = new URLSearchParams({
        source: "ai",
        documentId: apiDocumentIds[0] ?? "",
        runId: response.generationRunId,
      })

      if (apiDocumentIds.length > 1) {
        reviewQuery.set("documentIds", apiDocumentIds.join(","))
      }

      router.push(`/admin/tests/review?${reviewQuery.toString()}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("documents.generateTest.generationFailed")
      setGenerationError(message)
      setIsGenerating(false)
    }
  }, [
    canPreview,
    isGenerating,
    router,
    selectedDocumentIds,
    settings.difficulty,
    locale,
    settings.questionCount,
    settings.targetRole,
    settings.targetEmployeeIds,
    t,
  ])

  return (
    <div className="page-shell-narrow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="typography-h1">{t("documents.generateTest.title")}</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            {t("documents.generateTest.subtitle")}
          </p>
          <p className="mt-1 typography-small text-muted-foreground">
            {t("documents.generateTest.aiDraftHint")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReset}
            disabled={selectedDocuments.length === 0}
          >
            <RotateCcw className="mr-2 size-4" />
            {t("common.reset")}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!canPreview || isGenerating}
            title={
              canPreview
                ? undefined
                : getGenerateBlockReason(firstInvalidSelectedDocument ?? document, t)
            }
            onClick={() => handleGeneratePreview()}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {isGenerating
              ? t("documents.generateTest.generatingDraft")
              : t("documents.generateTest.generatePreview")}
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Breadcrumbs
          items={[
            { label: t("nav.documents"), href: "/admin/documents" },
            { label: document.title, href: `/admin/documents/${routeDocumentId}` },
            { label: t("documents.detail.generateTest") },
          ]}
        />

        {generationError ? (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <p>{generationError}</p>
            </div>
          </div>
        ) : null}

        {!isLatestVersion && !hasAcceptedOldVersion ? (
          <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-500" />
              <div>
                <p className="font-medium">{t("documents.generateTest.notLatestVersion.title")}</p>
                <p className="mt-1">{t("documents.generateTest.notLatestVersion.body")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/documents/${latestDocumentId}/generate-test`}>
                  {t("documents.generateTest.notLatestVersion.useLatest")}
                </Link>
              </Button>
              <Button type="button" size="sm" onClick={() => setHasAcceptedOldVersion(true)}>
                {t("documents.generateTest.notLatestVersion.continue")}
              </Button>
            </div>
          </div>
        ) : null}

        {!isGeneratable && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-500" />
            <p>{getGenerateBlockReason(firstInvalidSelectedDocument ?? document, t)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          <div className="flex flex-col gap-2 lg:col-span-8">
            <GenerateTestForm
              settings={settings}
              targetEmployees={targetEmployees}
              onSettingsChange={handleSettingsChange}
            />
            <MultiDocumentSelector
              selectableDocuments={
                selectableDocuments.length > 0 ? selectableDocuments : [document]
              }
              selectedDocumentIds={selectedDocumentIds}
              lockedDocumentId={initialDocumentId}
              onToggleDocument={handleToggleDocument}
            />
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
            <GenerateTestSummary selectedDocuments={selectedDocuments} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  )
}
