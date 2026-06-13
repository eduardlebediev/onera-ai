"use client"

import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, type ChangeEvent } from "react"

import { DocumentVersionDecisionDialog } from "@/features/documents/components/document-version-decision-dialog"
import { uploadDocumentVersion } from "@/features/documents/lib/document-upload-api-client"
import type { UploadDocumentVersionResponse } from "@/features/documents/schemas/document-upload-schema"
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu"

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.pptx,.txt,.md"

export function UpdateDocumentDropdownItem({
  documentId,
  disabled,
}: {
  documentId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
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

    setIsUploading(true)
    setErrorMessage(null)

    try {
      const result = await uploadDocumentVersion({
        documentId,
        file,
      })

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
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenuItem
        disabled={disabled || isUploading}
        onSelect={(event) => {
          event.preventDefault()
          handleChooseFile()
        }}
      >
        <Upload className="size-4" />
        {isUploading ? "Updating document..." : "Update document"}
      </DropdownMenuItem>
      {errorMessage ? (
        <div className="max-w-56 px-2 py-1 text-xs text-destructive">{errorMessage}</div>
      ) : null}
      {uploadResult ? (
        <DocumentVersionDecisionDialog
          result={uploadResult}
          onClose={() => setUploadResult(null)}
        />
      ) : null}
    </>
  )
}
