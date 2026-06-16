"use client"

import { Archive, Loader2, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import type { DocumentDetail } from "@/features/documents/types/document"
import { hasApiBackedDocument } from "@/features/documents/lib/demo-document-ids"
import {
  archiveDocument,
  permanentlyDeleteDocument,
} from "@/features/documents/lib/document-upload-api-client"
import type {
  ArchiveDocumentResponse,
  DeleteDocumentResponse,
} from "@/features/documents/schemas/document-upload-schema"
import { useTranslation } from "@/shared/i18n/use-translation"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/shared/ui/dropdown-menu"

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
  const { t } = useTranslation()

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">
            {t("documents.lifecycle.impact.affectedTests")}
          </span>{" "}
          {impact.affectedTestCount}
        </p>
        <p>
          <span className="font-medium text-foreground">
            {t("documents.lifecycle.impact.affectedQuestions")}
          </span>{" "}
          {impact.affectedQuestionCount}
        </p>
        <p>
          <span className="font-medium text-foreground">
            {t("documents.lifecycle.impact.activeAssignments")}
          </span>{" "}
          {impact.activeAssignmentCount}
        </p>
        <p>
          <span className="font-medium text-foreground">
            {t("documents.lifecycle.impact.completedAttempts")}
          </span>{" "}
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
                {t("documents.lifecycle.impact.questions", {
                  count: test.affectedQuestionCount,
                  plural: test.affectedQuestionCount === 1 ? "" : "s",
                })}{" "}
                ·{" "}
                {t("documents.lifecycle.impact.activeAssignment", {
                  count: test.activeAssignmentCount,
                  plural: test.activeAssignmentCount === 1 ? "" : "s",
                })}
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
  document: DocumentDetail
  onLifecycleComplete?: DocumentLifecycleCompleteHandler
}) {
  const router = useRouter()
  const { t } = useTranslation()
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
        toast.success(
          t("documents.lifecycle.archiveSuccess", { count: result.impact.affectedTestCount })
        )
      } else {
        result = await permanentlyDeleteDocument({
          documentId: document.id,
          deletionReason: deletionReason.trim() || undefined,
        })
        toast.success(t("documents.lifecycle.deleteSuccess"))
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
        error instanceof Error ? error.message : t("documents.lifecycle.actionFailed")
      )
      toast.error(
        pendingAction === "archive"
          ? t("documents.lifecycle.archiveFailed")
          : t("documents.lifecycle.deleteFailed")
      )
      setIsSubmitting(false)
    }
  }

  if (isDeleted || (!canArchive && !canDelete)) {
    return null
  }

  return (
    <>
      <DropdownMenuSeparator />
      {canArchive ? (
        <DropdownMenuItem onSelect={() => setPendingAction("archive")}>
          <Archive />
          {t("documents.lifecycle.archiveDocument")}
        </DropdownMenuItem>
      ) : null}
      {canDelete ? (
        <DropdownMenuItem variant="destructive" onSelect={() => setPendingAction("delete")}>
          <Trash2 />
          {t("documents.lifecycle.permanentlyDelete")}
        </DropdownMenuItem>
      ) : null}

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {pendingAction === "archive"
                    ? t("documents.lifecycle.archiveConfirmTitle")
                    : t("documents.lifecycle.deleteConfirmTitle")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pendingAction === "archive"
                    ? t("documents.lifecycle.archiveConfirmBody")
                    : t("documents.lifecycle.deleteConfirmBody")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("common.close")}
                onClick={closeDialog}
              >
                <X className="size-4" />
              </Button>
            </div>

            {pendingAction === "delete" ? (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-foreground">
                  {t("documents.lifecycle.deletionReason")}
                </span>
                <textarea
                  value={deletionReason}
                  onChange={(event) => setDeletionReason(event.target.value)}
                  className="mt-2 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  maxLength={1000}
                  placeholder={t("documents.lifecycle.deletionReasonPlaceholder")}
                />
              </label>
            ) : null}

            {errorMessage ? <p className="mt-4 text-sm text-destructive">{errorMessage}</p> : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={closeDialog} disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
              <Button
                variant={pendingAction === "delete" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {pendingAction === "archive"
                  ? t("documents.lifecycle.archiveDocumentAction")
                  : t("documents.lifecycle.permanentlyDeleteAction")}
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
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {action === "archive"
                ? t("documents.lifecycle.archivedTitle")
                : t("documents.lifecycle.deletedTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("documents.lifecycle.resultBody")}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label={t("common.close")} onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <ImpactSummaryPanel impact={impact} />
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>{t("common.close")}</Button>
        </div>
      </div>
    </div>
  )
}
