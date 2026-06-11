"use client"

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { type DocumentStatus, type MockDocumentDetail } from "@/data/mock/documents"
import {
  hasApiBackedDocument,
  resolveApiDocumentId,
  resolveReviewDocumentRouteId,
} from "@/features/documents/lib/demo-document-ids"
import { generateTestFromDocument } from "@/features/tests/lib/generated-test-api-client"
import { saveGeneratedTestDraft } from "@/features/tests/lib/generated-test-session"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { ChunkSelector } from "./chunk-selector"
import { GenerateTestForm } from "./generate-test-form"
import {
  canGenerateTest,
  deriveTopicsFromChunks,
  getDefaultGenerateTestSettings,
  getDefaultSelectedChunkIds,
  getDefaultSelectedTopics,
  getGenerateBlockReason,
  type GenerateTestSettings,
} from "./generate-test-model"
import { GenerateTestSummary } from "./generate-test-summary"
import { TopicSelector } from "./topic-selector"

interface GenerateTestSetupProps {
  document: MockDocumentDetail
  routeDocumentId: string
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
  uploaded: "Uploaded",
}

const STATUS_BADGE_CLASSES: Record<DocumentStatus, string> = {
  ready: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50",
  processing: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50",
  failed: "bg-red-50 text-red-600 border-red-200 hover:bg-red-50",
  uploaded: "bg-muted text-muted-foreground hover:bg-muted",
}

export function GenerateTestSetup({ document, routeDocumentId }: GenerateTestSetupProps) {
  const router = useRouter()
  const isGeneratable = canGenerateTest(document)
  const canCallApi = hasApiBackedDocument(routeDocumentId)
  const defaultTopics = useMemo(() => getDefaultSelectedTopics(document), [document])
  const defaultChunkIds = useMemo(
    () => getDefaultSelectedChunkIds(document, defaultTopics),
    [defaultTopics, document]
  )
  const defaultSettings = useMemo(() => getDefaultGenerateTestSettings(document), [document])

  const [settings, setSettings] = useState<GenerateTestSettings>(defaultSettings)
  const [selectedTopics, setSelectedTopics] = useState<string[]>(defaultTopics)
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>(defaultChunkIds)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const canPreview = isGeneratable && selectedChunkIds.length > 0 && selectedTopics.length > 0
  const reviewDocumentId = resolveReviewDocumentRouteId(routeDocumentId)

  const handleSettingsChange = useCallback((updates: Partial<GenerateTestSettings>) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...updates }))
  }, [])

  const handleToggleTopic = useCallback(
    (topic: string) => {
      const topicChunkIds = document.chunks
        .filter((chunk) => chunk.topic === topic)
        .map((chunk) => chunk.id)
      const isSelected = selectedTopics.includes(topic)

      setSelectedTopics((currentTopics) =>
        isSelected
          ? currentTopics.filter((currentTopic) => currentTopic !== topic)
          : [...currentTopics, topic]
      )
      setSelectedChunkIds((currentChunkIds) =>
        isSelected
          ? currentChunkIds.filter((chunkId) => !topicChunkIds.includes(chunkId))
          : Array.from(new Set([...currentChunkIds, ...topicChunkIds]))
      )
    },
    [document.chunks, selectedTopics]
  )

  const handleToggleChunk = useCallback(
    (chunkId: string) => {
      const chunk = document.chunks.find((currentChunk) => currentChunk.id === chunkId)
      const isRemoving = selectedChunkIds.includes(chunkId)

      const nextChunkIds = isRemoving
        ? selectedChunkIds.filter((id) => id !== chunkId)
        : [...selectedChunkIds, chunkId]

      setSelectedChunkIds(nextChunkIds)

      if (isRemoving) {
        setSelectedTopics(deriveTopicsFromChunks(document, nextChunkIds))
      } else if (chunk && !selectedTopics.includes(chunk.topic)) {
        setSelectedTopics((currentTopics) => [...currentTopics, chunk.topic])
      }
    },
    [document, selectedChunkIds, selectedTopics]
  )

  const handleSelectAllChunks = useCallback(() => {
    setSelectedChunkIds(document.chunks.map((chunk) => chunk.id))
    setSelectedTopics(Array.from(new Set(document.chunks.map((chunk) => chunk.topic))))
  }, [document.chunks])

  const handleClearAllChunks = useCallback(() => {
    setSelectedChunkIds([])
    setSelectedTopics([])
  }, [])

  const handleReset = useCallback(() => {
    setSettings(defaultSettings)
    setSelectedTopics(defaultTopics)
    setSelectedChunkIds(defaultChunkIds)
    setGenerationError(null)
  }, [defaultChunkIds, defaultSettings, defaultTopics])

  const handleMockPreview = useCallback(() => {
    router.push(`/admin/tests/review?documentId=${encodeURIComponent(reviewDocumentId)}`)
  }, [reviewDocumentId, router])

  const handleGeneratePreview = useCallback(async () => {
    if (!canPreview || isGenerating) return

    setGenerationError(null)

    const apiDocumentId = resolveApiDocumentId(routeDocumentId)

    if (!apiDocumentId) {
      handleMockPreview()
      return
    }

    setIsGenerating(true)

    try {
      const response = await generateTestFromDocument({
        documentId: apiDocumentId,
        questionCount: settings.questionCount,
        difficulty: settings.difficulty,
        language: settings.language,
        targetRole: settings.targetRole,
      })

      saveGeneratedTestDraft(response)

      const reviewQuery = new URLSearchParams({
        source: "ai",
        documentId: apiDocumentId,
        runId: response.generationRunId,
      })

      router.push(`/admin/tests/review?${reviewQuery.toString()}`)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not generate the test draft. Please check that this document has embedded chunks and try again."
      setGenerationError(message)
      setIsGenerating(false)
    }
  }, [
    canPreview,
    handleMockPreview,
    isGenerating,
    routeDocumentId,
    router,
    settings.difficulty,
    settings.language,
    settings.questionCount,
    settings.targetRole,
  ])

  return (
    <div className="page-shell-narrow">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="typography-h1">Generate Test Setup</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            Configure test settings from the selected document topics and source chunks.
          </p>
          {canCallApi ? (
            <p className="mt-1 typography-small text-muted-foreground">
              AI-generated draft. Review before publishing.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href={`/admin/documents/${routeDocumentId}`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Document
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={handleReset}
            disabled={!isGeneratable}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
          <Button
            type="button"
            disabled={!canPreview || isGenerating}
            className="h-10 rounded-xl bg-foreground text-background"
            title={canPreview ? undefined : getGenerateBlockReason(document)}
            onClick={() => handleGeneratePreview()}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {isGenerating ? "Generating test draft..." : "Generate Test Preview"}
          </Button>
        </div>
      </div>

      {generationError ? (
        <div className="mb-6 space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
            <p>{generationError}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleMockPreview}>
            Continue with mock preview
          </Button>
        </div>
      ) : null}

      {!isGeneratable && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-500" />
          <p>{getGenerateBlockReason(document)}</p>
        </div>
      )}

      {isGeneratable && (selectedTopics.length === 0 || selectedChunkIds.length === 0) && (
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Select at least one topic and one source chunk to generate a test preview.
        </div>
      )}

      <DocumentSourceSummary document={document} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`space-y-6 lg:col-span-8 ${!isGeneratable ? "opacity-50 pointer-events-none" : ""}`}
        >
          <GenerateTestForm settings={settings} onSettingsChange={handleSettingsChange} />
          <TopicSelector
            document={document}
            selectedTopics={selectedTopics}
            onToggleTopic={handleToggleTopic}
          />
          <ChunkSelector
            chunks={document.chunks}
            selectedChunkIds={selectedChunkIds}
            onToggleChunk={handleToggleChunk}
            onSelectAll={handleSelectAllChunks}
            onClearAll={handleClearAllChunks}
          />
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
          <GenerateTestSummary
            document={document}
            settings={settings}
            selectedTopicsCount={selectedTopics.length}
            selectedChunksCount={selectedChunkIds.length}
          />
        </div>
      </div>
    </div>
  )
}

function DocumentSourceSummary({ document }: { document: MockDocumentDetail }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
              <FileText className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">{document.title}</h2>
                <Badge variant="outline" className={STATUS_BADGE_CLASSES[document.status]}>
                  {document.status === "ready" && <CheckCircle2 className="mr-1.5 size-3.5" />}
                  {STATUS_LABELS[document.status]}
                </Badge>
              </div>
              <p className="mt-1 typography-small line-clamp-2 text-muted-foreground">
                {document.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-12 md:mr-8">
            <div className="flex flex-col">
              <span className="typography-small text-muted-foreground">Detected Topics</span>
              <span className="text-2xl font-semibold text-foreground mt-0.5">
                {document.topics.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="typography-small text-muted-foreground">Content Chunks</span>
              <span className="text-2xl font-semibold text-foreground mt-0.5">
                {document.chunks.length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
