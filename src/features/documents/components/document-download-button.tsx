"use client"

import { Download } from "lucide-react"
import { useState } from "react"

import { requestDocumentDownloadUrl } from "@/features/documents/lib/document-upload-api-client"
import { Button } from "@/shared/ui/button"

interface DocumentDownloadButtonProps {
  documentId: string
  disabled?: boolean
}

export function DocumentDownloadButton({
  documentId,
  disabled = false,
}: DocumentDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDownload = async () => {
    setErrorMessage(null)
    setIsLoading(true)

    try {
      const signedUrl = await requestDocumentDownloadUrl(documentId)
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed"
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" disabled={disabled || isLoading} onClick={handleDownload}>
        <Download />
        {isLoading ? "Preparing..." : "Download original"}
      </Button>
      {errorMessage ? <span className="text-xs text-destructive">{errorMessage}</span> : null}
    </div>
  )
}
