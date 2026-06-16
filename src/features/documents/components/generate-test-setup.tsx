"use client"

import { AlertTriangle, ArrowLeft, Loader2, RotateCcw, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { type DocumentDetail } from "@/features/documents/types/document"
import { resolveApiDocumentId } from "@/features/documents/lib/demo-document-ids"
import { DocumentTopicSelectionGroup } from "@/features/documents/components/document-topic-selection-group"
import { GenerateTestForm } from "@/features/documents/components/generate-test-form"
import {
  canGenerateTest,
  deriveTopicsFromChunks,
  getDefaultGenerateTestSettings,
  getDefaultSelectedChunkIds,
  getDefaultSelectedTopics,
  getGenerateBlockReason,
  MAX_SELECTABLE_DOCUMENTS,
  type GenerateTestSettings,
} from "@/features/documents/components/generate-test-model"
import { GenerateTestSummary } from "@/features/documents/components/generate-test-summary"
import { MultiDocumentSelector } from "@/features/documents/components/multi-document-selector"
import { generateTestFromDocument } from "@/features/tests/lib/generated-test-api-client"
import { saveGeneratedTestDraft } from "@/features/tests/lib/generated-test-session"
import { Breadcrumbs } from "@/shared/components/breadcrumbs"
import { Button } from "@/shared/ui/button"

interface GenerateTestSetupProps {
  document: DocumentDetail
  routeDocumentId: string
  selectableDocuments: DocumentDetail[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function GenerateTestSetup({
  document,
  routeDocumentId,
  selectableDocuments,
}: GenerateTestSetupProps) {
  const router = useRouter()
  const documentsById = useMemo(() => {
    const map = new Map<string, DocumentDetail>()

    for (const item of selectableDocuments) {
      map.set(item.id, item)
    }

    map.set(document.id, document)

    return map
  }, [document, selectableDocuments])

  const initialDocumentId = document.id
  const defaultTopics = useMemo(() => getDefaultSelectedTopics(document), [document])
  const defaultChunkIds = useMemo(
    () => getDefaultSelectedChunkIds(document, defaultTopics),
    [defaultTopics, document]
  )
  const defaultSettings = useMemo(() => getDefaultGenerateTestSettings(document), [document])

  const [settings, setSettings] = useState<GenerateTestSettings>(defaultSettings)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([initialDocumentId])
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(defaultTopics)
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>(defaultChunkIds)
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
    isGeneratable &&
    selectedDocumentIds.length > 0 &&
    selectedChunkIds.length > 0 &&
    selectedTopicIds.length > 0 &&
    (isLatestVersion || hasAcceptedOldVersion)

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

          const nextIds = currentIds.filter((id) => id !== documentId)
          const removedDocument = documentsById.get(documentId)

          if (removedDocument) {
            const removedChunkIds = new Set(removedDocument.chunks.map((chunk) => chunk.id))
            setSelectedChunkIds((chunkIds) =>
              chunkIds.filter((chunkId) => !removedChunkIds.has(chunkId))
            )
            setSelectedTopicIds((topicIds) =>
              topicIds.filter((topicId) => !topicId.startsWith(`${documentId}:`))
            )
          }

          return nextIds
        }

        if (currentIds.length >= MAX_SELECTABLE_DOCUMENTS) {
          return currentIds
        }

        return [...currentIds, documentId]
      })
    },
    [documentsById, initialDocumentId]
  )

  const handleToggleTopic = useCallback(
    (documentId: string, topicKey: string, topicChunkIds: string[]) => {
      const isSelected = selectedTopicIds.includes(topicKey)

      setSelectedTopicIds((currentTopics) =>
        isSelected
          ? currentTopics.filter((currentTopic) => currentTopic !== topicKey)
          : [...currentTopics, topicKey]
      )
      setSelectedChunkIds((currentChunkIds) =>
        isSelected
          ? currentChunkIds.filter((chunkId) => !topicChunkIds.includes(chunkId))
          : Array.from(new Set([...currentChunkIds, ...topicChunkIds]))
      )
    },
    [selectedTopicIds]
  )

  const handleToggleChunk = useCallback(
    (documentId: string, chunkId: string, topicKey?: string) => {
      const selectedDocument = documentsById.get(documentId)
      const isRemoving = selectedChunkIds.includes(chunkId)

      const nextChunkIds = isRemoving
        ? selectedChunkIds.filter((id) => id !== chunkId)
        : [...selectedChunkIds, chunkId]

      setSelectedChunkIds(nextChunkIds)

      if (selectedDocument) {
        setSelectedTopicIds(deriveTopicsFromChunks(selectedDocument, nextChunkIds))
      } else if (topicKey && !isRemoving) {
        setSelectedTopicIds((currentTopics) =>
          currentTopics.includes(topicKey) ? currentTopics : [...currentTopics, topicKey]
        )
      }
    },
    [documentsById, selectedChunkIds]
  )

  const handleSelectAllChunks = useCallback(
    (documentId: string) => {
      const selectedDocument = documentsById.get(documentId)

      if (!selectedDocument) {
        return
      }

      const documentChunkIds = selectedDocument.chunks.map((chunk) => chunk.id)

      setSelectedChunkIds((currentChunkIds) =>
        Array.from(new Set([...currentChunkIds, ...documentChunkIds]))
      )
      setSelectedTopicIds((currentTopics) =>
        Array.from(
          new Set([
            ...currentTopics,
            ...getDefaultSelectedTopics(selectedDocument).map((topic) => `${documentId}:${topic}`),
          ])
        )
      )
    },
    [documentsById]
  )

  const handleClearAllChunks = useCallback(
    (documentId: string) => {
      const selectedDocument = documentsById.get(documentId)

      if (!selectedDocument) {
        return
      }

      const documentChunkIds = new Set(selectedDocument.chunks.map((chunk) => chunk.id))

      setSelectedChunkIds((currentChunkIds) =>
        currentChunkIds.filter((chunkId) => !documentChunkIds.has(chunkId))
      )
      setSelectedTopicIds((currentTopics) =>
        currentTopics.filter((topicId) => !topicId.startsWith(`${documentId}:`))
      )
    },
    [documentsById]
  )

  const handleReset = useCallback(() => {
    setSettings(defaultSettings)
    setSelectedDocumentIds([initialDocumentId])
    setSelectedTopicIds(defaultTopics)
    setSelectedChunkIds(defaultChunkIds)
    setGenerationError(null)
  }, [defaultChunkIds, defaultSettings, defaultTopics, initialDocumentId])

  const handleGeneratePreview = useCallback(async () => {
    if (!canPreview || isGenerating) return

    setGenerationError(null)

    const apiDocumentIds = selectedDocumentIds.flatMap((documentId) => {
      const apiId = resolveApiDocumentId(documentId) ?? (isUuid(documentId) ? documentId : null)
      return apiId ? [apiId] : []
    })

    if (apiDocumentIds.length === 0) {
      setGenerationError("Select at least one saved Supabase document before generating a test.")
      return
    }

    setIsGenerating(true)

    try {
      const apiTopicIds = selectedTopicIds.filter(isUuid)
      const apiChunkIds = selectedChunkIds.filter(isUuid)

      const response = await generateTestFromDocument({
        documentIds: apiDocumentIds,
        selectedTopicIds: apiTopicIds.length > 0 ? apiTopicIds : undefined,
        selectedChunkIds: apiChunkIds.length > 0 ? apiChunkIds : undefined,
        questionCount: settings.questionCount,
        difficulty: settings.difficulty,
        language: settings.language,
        targetRole: settings.targetRole,
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
        error instanceof Error
          ? error.message
          : "Could not generate the test draft. Please check that selected documents have embedded chunks and try again."
      setGenerationError(message)
      setIsGenerating(false)
    }
  }, [
    canPreview,
    isGenerating,
    router,
    selectedChunkIds,
    selectedDocumentIds,
    selectedTopicIds,
    settings.difficulty,
    settings.language,
    settings.questionCount,
    settings.targetRole,
  ])

  return (
    <div className="page-shell-narrow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="typography-h1">Generate Test Setup</h1>
          <p className="mt-1 typography-p text-muted-foreground">
            Configure test settings from one or more source documents, topics, and chunks.
          </p>
          <p className="mt-1 typography-small text-muted-foreground">
            AI-generated draft. Review before publishing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link href={`/admin/documents/${routeDocumentId}`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Document
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReset}
            disabled={selectedDocuments.length === 0}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!canPreview || isGenerating}
            title={
              canPreview
                ? undefined
                : getGenerateBlockReason(firstInvalidSelectedDocument ?? document)
            }
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

      <div className="mt-2 flex flex-col gap-2">
        <Breadcrumbs
          items={[
            { label: "Documents", href: "/admin/documents" },
            { label: document.title, href: `/admin/documents/${routeDocumentId}` },
            { label: "Generate Test" },
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
                <p className="font-medium">This is not the latest document version.</p>
                <p className="mt-1">Use the latest version instead, or explicitly continue here.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/documents/${latestDocumentId}/generate-test`}>
                  Use latest version
                </Link>
              </Button>
              <Button type="button" size="sm" onClick={() => setHasAcceptedOldVersion(true)}>
                Continue with this version
              </Button>
            </div>
          </div>
        ) : null}

        {!isGeneratable && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-500" />
            <p>{getGenerateBlockReason(firstInvalidSelectedDocument ?? document)}</p>
          </div>
        )}

        {isGeneratable && (selectedTopicIds.length === 0 || selectedChunkIds.length === 0) && (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Select at least one topic and one source chunk across the selected documents.
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          <div className="flex flex-col gap-2 lg:col-span-8">
            <MultiDocumentSelector
              selectableDocuments={
                selectableDocuments.length > 0 ? selectableDocuments : [document]
              }
              selectedDocumentIds={selectedDocumentIds}
              lockedDocumentId={initialDocumentId}
              onToggleDocument={handleToggleDocument}
            />
            <GenerateTestForm settings={settings} onSettingsChange={handleSettingsChange} />
            {selectedDocuments.map((selectedDocument) => (
              <DocumentTopicSelectionGroup
                key={selectedDocument.id}
                document={selectedDocument}
                selectedTopicIds={selectedTopicIds}
                selectedChunkIds={selectedChunkIds}
                onToggleTopic={handleToggleTopic}
                onToggleChunk={handleToggleChunk}
                onSelectAllChunks={handleSelectAllChunks}
                onClearAllChunks={handleClearAllChunks}
              />
            ))}
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
            <GenerateTestSummary
              selectedDocuments={selectedDocuments}
              settings={settings}
              selectedTopicsCount={selectedTopicIds.length}
              selectedChunksCount={selectedChunkIds.length}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
