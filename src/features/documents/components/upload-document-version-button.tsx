"use client"

import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, type ChangeEvent } from "react"

import { DocumentVersionDecisionDialog } from "@/features/documents/components/document-version-decision-dialog"
import { uploadDocumentVersion } from "@/features/documents/lib/document-upload-api-client"
import type { UploadDocumentVersionResponse } from "@/features/documents/schemas/document-upload-schema"
import { Button } from "@/shared/ui/button"

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.pptx,.txt,.md"
const MAX_UPLOAD_MB = 10

export function UploadDocumentVersionButton({
  documentId,
  disabled,
}: {
  documentId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [changeMessage, setChangeMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadDocumentVersionResponse | null>(null)

  const handleChooseFile = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setErrorMessage(null)
    setIsUploading(true)

    try {
      const result = await uploadDocumentVersion({
        documentId,
        file,
        changeMessage,
      })

      setChangeMessage("")

      if (result.requiresDecision) {
        setUploadResult(result)
      } else {
        router.push(`/admin/documents/${result.documentId}`)
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Version upload failed"
      setErrorMessage(message)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
      <textarea
        value={changeMessage}
        onChange={(event) => setChangeMessage(event.target.value)}
        placeholder="Change message (optional)"
        className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        disabled={disabled || isUploading}
        maxLength={1000}
      />
      <Button variant="outline" onClick={handleChooseFile} disabled={disabled || isUploading}>
        <Upload className="mr-2 size-4" />
        {isUploading ? "Uploading new version..." : "Upload new version"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Supported: PDF, DOCX, PPTX, TXT, MD. Max {MAX_UPLOAD_MB} MB.
      </p>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
      {uploadResult ? (
        <DocumentVersionDecisionDialog
          result={uploadResult}
          onClose={() => setUploadResult(null)}
        />
      ) : null}
    </div>
  )
}
