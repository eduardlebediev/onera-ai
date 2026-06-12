"use client"

import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, type ChangeEvent } from "react"

import { uploadDocument } from "@/features/documents/lib/document-upload-api-client"
import { Button } from "@/shared/ui/button"

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.pptx,.txt,.md"
const MAX_UPLOAD_MB = 10

export function DocumentUploadButton() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      const result = await uploadDocument(file)
      router.push(result.redirectTo)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setErrorMessage(message)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button className="shrink-0 rounded-full" onClick={handleChooseFile} disabled={isUploading}>
        <Upload className="mr-2 size-4" />
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
      <p className="max-w-sm text-right text-xs text-muted-foreground">
        Supported: PDF, DOCX, PPTX, TXT, MD. Max {MAX_UPLOAD_MB} MB.
      </p>
      {errorMessage ? (
        <p className="max-w-sm text-right text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
