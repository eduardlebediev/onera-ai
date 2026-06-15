"use client"

import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"

import { uploadDocument } from "@/features/documents/lib/document-upload-api-client"
import { cn } from "@/lib/utils"
import { Button } from "@/shared/ui/button"

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.pptx,.txt,.md"

interface DocumentUploadButtonProps {
  className?: string
  iconClassName?: string
  showInlineError?: boolean
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}

export function DocumentUploadButton({
  className = "shrink-0",
  iconClassName = "mr-2 size-4",
  showInlineError = true,
  size = "lg",
  variant = "default",
}: DocumentUploadButtonProps = {}) {
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
      toast.success("Document uploaded. Processing started.")
      router.push(result.redirectTo)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setErrorMessage(message)
      toast.error(`Upload failed. ${message}`)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className={cn(showInlineError && "flex flex-col items-end gap-2")}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        className={className}
        disabled={isUploading}
        onClick={handleChooseFile}
        size={size}
        variant={variant}
      >
        <Upload className={iconClassName} />
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
      {showInlineError && errorMessage ? (
        <p className="max-w-sm text-right text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
