"use client"

import { Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { generateTestFromDocument } from "@/features/tests/lib/generated-test-api-client"
import { saveGeneratedTestDraft } from "@/features/tests/lib/generated-test-session"
import { Button } from "@/shared/ui/button"

export function GenerateLatestVersionDraftButton({
  documentId,
  templateTestId,
}: {
  documentId: string
  templateTestId: string
}) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      const response = await generateTestFromDocument({
        documentId,
        templateTestId,
      })

      saveGeneratedTestDraft(response)

      const reviewQuery = new URLSearchParams({
        source: "ai",
        documentId: response.document.id,
        runId: response.generationRunId,
      })

      router.push(`/admin/tests/review?${reviewQuery.toString()}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not generate a new draft from the latest document version."
      setErrorMessage(message)
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 size-4" />
        )}
        Generate new draft from latest version
      </Button>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  )
}
