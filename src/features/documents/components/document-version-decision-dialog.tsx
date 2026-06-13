"use client"

import { Loader2, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import type { UploadDocumentVersionResponse } from "@/features/documents/schemas/document-upload-schema"
import { generateTestFromDocument } from "@/features/tests/lib/generated-test-api-client"
import { saveGeneratedTestDraft } from "@/features/tests/lib/generated-test-session"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

export function DocumentVersionDecisionDialog({
  result,
  onClose,
}: {
  result: UploadDocumentVersionResponse
  onClose: () => void
}) {
  const router = useRouter()
  const [selectedTemplateTestId, setSelectedTemplateTestId] = useState<string | null>(
    result.affectedTests[0]?.testId ?? null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedTest = useMemo(
    () => result.affectedTests.find((test) => test.testId === selectedTemplateTestId) ?? null,
    [result.affectedTests, selectedTemplateTestId]
  )

  const closeAndOpenDocument = () => {
    onClose()
    router.push(`/admin/documents/${result.documentId}`)
    router.refresh()
  }

  const handleGenerateDraft = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      const response = await generateTestFromDocument({
        documentId: result.documentId,
        templateTestId: selectedTemplateTestId ?? undefined,
      })

      saveGeneratedTestDraft(response)

      const reviewQuery = new URLSearchParams({
        source: "ai",
        documentId: result.documentId,
        runId: response.generationRunId,
      })

      router.push(`/admin/tests/review?${reviewQuery.toString()}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not generate a new draft from the latest version."
      setErrorMessage(message)
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              A new version of this document is ready.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Some existing tests were generated from the previous version. What would you like to
              do?
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={closeAndOpenDocument}>
            <X className="size-4" />
          </Button>
        </div>

        {result.aiChangeSummary ? (
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            <p className="font-medium text-foreground">AI change summary</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {result.aiChangeSummary}
            </p>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Affected tests</p>
          {result.affectedTests.length > 0 ? (
            <div className="space-y-2">
              {result.affectedTests.map((test) => (
                <button
                  key={test.testId}
                  type="button"
                  onClick={() => setSelectedTemplateTestId(test.testId)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selectedTemplateTestId === test.testId
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-background hover:bg-muted/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{test.title}</span>
                    <Badge variant="outline" className="capitalize">
                      {test.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {test.questionCount} question{test.questionCount === 1 ? "" : "s"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tests use the previous version.</p>
          )}
        </div>

        {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={closeAndOpenDocument}>
            Decide later
          </Button>
          <Button variant="outline" onClick={closeAndOpenDocument}>
            Keep existing tests
          </Button>
          <Button onClick={handleGenerateDraft} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {selectedTest ? "Generate draft using selected test" : "Generate new draft"}
          </Button>
        </div>
      </div>
    </div>
  )
}
