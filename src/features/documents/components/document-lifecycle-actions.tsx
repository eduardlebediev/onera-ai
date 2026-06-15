"use client"

import { Archive, Loader2, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import type { MockDocumentDetail } from "@/data/mock/documents"
import { hasApiBackedDocument } from "@/features/documents/lib/demo-document-ids"
import {
  archiveDocument,
  permanentlyDeleteDocument,
} from "@/features/documents/lib/document-upload-api-client"
import type {
  ArchiveDocumentResponse,
  DeleteDocumentResponse,
} from "@/features/documents/schemas/document-upload-schema"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"

type LifecycleAction = "archive" | "delete"

export type DocumentLifecycleStatus =
  | ArchiveDocumentResponse["status"]
  | DeleteDocumentResponse["status"]

export type DocumentLifecycleCompleteHandler = (
  documentId: string,
  status: DocumentLifecycleStatus
) => void

function ImpactSummaryPanel({
  impact,
}: {
  impact: ArchiveDocumentResponse["impact"] | DeleteDocumentResponse["impact"]
}) {
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">Affected tests:</span>{" "}
          {impact.affectedTestCount}
        </p>
        <p>
          <span className="font-medium text-foreground">Affected questions:</span>{" "}
          {impact.affectedQuestionCount}
        </p>
        <p>
          <span className="font-medium text-foreground">Active assignments:</span>{" "}
          {impact.activeAssignmentCount}
        </p>
        <p>
          <span className="font-medium text-foreground">Completed attempts:</span>{" "}
          {impact.completedAttemptCount}
        </p>
      </div>
      {impact.affectedTests.length > 0 ? (
        <div className="space-y-2">
          {impact.affectedTests.map((test) => (
            <div
              key={test.testId}
              className="rounded-md border border-border/50 bg-background px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{test.title}</span>
                <Badge variant="outline" className="capitalize">
                  {test.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {test.affectedQuestionCount} question
                {test.affectedQuestionCount === 1 ? "" : "s"} · {test.activeAssignmentCount} active
                assignment{test.activeAssignmentCount === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function DocumentLifecycleActions({
  document,
  onLifecycleComplete,
}: {
  document: MockDocumentDetail
  onLifecycleComplete?: DocumentLifecycleCompleteHandler
}) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<LifecycleAction | null>(null)
  const [completedAction, setCompletedAction] = useState<{
    action: LifecycleAction
    impact: ArchiveDocumentResponse["impact"] | DeleteDocumentResponse["impact"]
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deletionReason, setDeletionReason] = useState("")

  const isApiBacked = hasApiBackedDocument(document.id)
  const isDeleted = document.status === "deleted"
  const isArchived = document.status === "archived"
  const supportsArchiveDelete = document.supportsArchiveDelete !== false
  const canArchive = isApiBacked && supportsArchiveDelete && !isDeleted && !isArchived
  const canDelete = isApiBacked && supportsArchiveDelete && !isDeleted

  const closeDialog = () => {
    if (isSubmitting) return
    setPendingAction(null)
    setErrorMessage(null)
    setDeletionReason("")
  }

  const handleConfirm = async () => {
    if (!pendingAction || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      let result: ArchiveDocumentResponse | DeleteDocumentResponse

      if (pendingAction === "archive") {
        result = await archiveDocument(document.id)
        toast.success(`Document archived. ${result.impact.affectedTestCount} tests affected.`)
      } else {
        result = await permanentlyDeleteDocument({
          documentId: document.id,
          deletionReason: deletionReason.trim() || undefined,
        })
        toast.success("Document permanently deleted.")
      }

      setCompletedAction({
        action: pendingAction,
        impact: result.impact,
      })
      onLifecycleComplete?.(result.documentId, result.status)
      setPendingAction(null)
      setDeletionReason("")
      setIsSubmitting(false)
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not complete this document action."
      )
      toast.error(
        pendingAction === "archive" ? "Archive failed. Try again." : "Delete failed. Try again."
      )
      setIsSubmitting(false)
    }
  }

  if (isDeleted) {
    return (
      <p className="text-sm text-muted-foreground">
        This document was permanently deleted. Completed test results remain available.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {canArchive ? (
          <Button variant="outline" className="w-full" onClick={() => setPendingAction("archive")}>
            <Archive className="mr-2 size-4" />
            Archive Document
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            disabled
            title={
              !supportsArchiveDelete
                ? "Apply migration 00006 before archiving documents."
                : !isApiBacked
                  ? "Only Supabase-backed documents can be archived"
                  : isArchived
                    ? "Document is already archived"
                    : "Deleted documents cannot be archived"
            }
          >
            <Archive className="mr-2 size-4" />
            Archive Document
          </Button>
        )}

        {canDelete ? (
          <Button
            variant="outline"
            className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setPendingAction("delete")}
          >
            <Trash2 className="mr-2 size-4" />
            Permanently Delete
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled
            title={
              !supportsArchiveDelete
                ? "Apply migration 00006 before permanently deleting documents."
                : !isApiBacked
                  ? "Only Supabase-backed documents can be permanently deleted"
                  : "This document is already permanently deleted"
            }
          >
            <Trash2 className="mr-2 size-4" />
            Permanently Delete
          </Button>
        )}
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {pendingAction === "archive"
                    ? "Archive document?"
                    : "Permanently delete document?"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pendingAction === "archive"
                    ? "Archiving this document will remove it from future test generation and make dependent tests inactive until reviewed. Existing completed results will remain available."
                    : "This permanently removes the uploaded file, extracted text, chunks, and topics. The document row will remain as a deleted reference. Tests and questions that used this document will stay inactive and show that the source document was deleted. Completed results will remain available."}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={closeDialog}>
                <X className="size-4" />
              </Button>
            </div>

            {pendingAction === "delete" ? (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-foreground">Deletion reason (optional)</span>
                <textarea
                  value={deletionReason}
                  onChange={(event) => setDeletionReason(event.target.value)}
                  className="mt-2 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  maxLength={1000}
                  placeholder="Why is this document being removed?"
                />
              </label>
            ) : null}

            {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant={pendingAction === "delete" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {pendingAction === "archive" ? "Archive document" : "Permanently delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {completedAction ? (
        <DocumentLifecycleResultDialog
          action={completedAction.action}
          impact={completedAction.impact}
          onClose={() => setCompletedAction(null)}
        />
      ) : null}
    </>
  )
}

export function DocumentLifecycleResultDialog({
  impact,
  action,
  onClose,
}: {
  impact: ArchiveDocumentResponse["impact"] | DeleteDocumentResponse["impact"]
  action: LifecycleAction
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {action === "archive" ? "Document archived" : "Document permanently deleted"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dependent tests were marked inactive. Completed results remain available.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <ImpactSummaryPanel impact={impact} />
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
