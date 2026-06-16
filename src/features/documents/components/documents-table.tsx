"use client"

import { memo, useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Archive, FileText, Filter, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  type DocumentFileType,
  type DocumentStatus,
  type DocumentDetail,
} from "@/features/documents/types/document"
import {
  canGenerateTest,
  getGenerateBlockReason,
} from "@/features/documents/components/generate-test-model"
import type { DocumentLifecycleStatus } from "@/features/documents/components/document-lifecycle-actions"
import { hasApiBackedDocument } from "@/features/documents/lib/demo-document-ids"
import {
  archiveDocument,
  permanentlyDeleteDocument,
  retryDocumentIngestion,
} from "@/features/documents/lib/document-upload-api-client"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { DataTableBulkActions } from "@/shared/ui/data-table-bulk-actions"
import { DataTable } from "@/shared/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header"
import { DataTableSelectionCheckbox } from "@/shared/ui/data-table-selection-checkbox"
import { DataTableShell } from "@/shared/ui/data-table-shell"
import { useSelection } from "@/shared/ui/use-selection"
import { DocumentDrawer } from "./document-drawer"

type StatusFilter = "active" | "archived" | "deleted" | "all"

const STATUS_LABELS: Record<DocumentStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
  uploaded: "Uploaded",
  archived: "Archived",
  deleted: "Deleted",
}

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
  { label: "Deleted", value: "deleted" },
  { label: "All", value: "all" },
]

const STATUS_VARIANTS: Record<DocumentStatus, "default" | "secondary" | "destructive" | "outline"> =
  {
    ready: "default",
    processing: "secondary",
    failed: "destructive",
    uploaded: "outline",
    archived: "secondary",
    deleted: "destructive",
  }

const FILE_ICON_STYLES: Record<DocumentFileType, string> = {
  pdf: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30",
  docx: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30",
  pptx: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30",
  txt: "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800",
  md: "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800",
}

interface DocumentsTableProps {
  documents: DocumentDetail[]
}

type LifecycleStatusOverrides = Record<
  string,
  {
    status: DocumentLifecycleStatus
    timestamp: string
  }
>

type PendingDocumentAction = {
  documentId: string
  action: "retry" | "delete"
}

type BulkDocumentAction = "archive" | "delete"

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date("2024-06-20")
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
  }
  if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
  }
  return `${diffDays} days ago`
}

function formatFileSize(sizeMb: number): string {
  return sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${Math.round(sizeMb * 1024)} KB`
}

function canBulkArchiveDocument(document: DocumentDetail): boolean {
  return (
    hasApiBackedDocument(document.id) &&
    document.supportsArchiveDelete !== false &&
    document.status !== "archived" &&
    document.status !== "deleted"
  )
}

function canBulkDeleteDocument(document: DocumentDetail): boolean {
  return (
    hasApiBackedDocument(document.id) &&
    document.supportsArchiveDelete !== false &&
    document.status !== "deleted"
  )
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const router = useRouter()
  const { selectedIds, toggle, selectAll, clearSelection } = useSelection()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [lifecycleStatusOverrides, setLifecycleStatusOverrides] =
    useState<LifecycleStatusOverrides>({})
  const [pendingDocumentAction, setPendingDocumentAction] = useState<PendingDocumentAction | null>(
    null
  )
  const [bulkDocumentAction, setBulkDocumentAction] = useState<BulkDocumentAction | null>(null)
  const [documentActionError, setDocumentActionError] = useState<string | null>(null)

  const handleOpenDrawer = useCallback((document: DocumentDetail) => {
    setSelectedDocumentId(document.id)
    setIsDrawerOpen(true)
  }, [])

  const handleLifecycleComplete = useCallback(
    (documentId: string, status: DocumentLifecycleStatus) => {
      setLifecycleStatusOverrides((currentOverrides) => ({
        ...currentOverrides,
        [documentId]: {
          status,
          timestamp: new Date().toISOString(),
        },
      }))
    },
    []
  )

  const handleRetryFailedDocument = useCallback(
    async (documentId: string) => {
      setDocumentActionError(null)
      setPendingDocumentAction({ documentId, action: "retry" })

      try {
        await retryDocumentIngestion(documentId)
        router.refresh()
      } catch (error) {
        setDocumentActionError(
          error instanceof Error ? error.message : "Could not retry document processing."
        )
      } finally {
        setPendingDocumentAction(null)
      }
    },
    [router]
  )

  const handleDeleteFailedDocument = useCallback(
    async (documentId: string) => {
      const confirmed = window.confirm("Delete this failed document upload?")

      if (!confirmed) {
        return
      }

      setDocumentActionError(null)
      setPendingDocumentAction({ documentId, action: "delete" })

      try {
        await permanentlyDeleteDocument({
          documentId,
          deletionReason: "Deleted failed upload from the documents table.",
        })
        handleLifecycleComplete(documentId, "deleted")
        toast.success("Document permanently deleted.")
        router.refresh()
      } catch (error) {
        setDocumentActionError(
          error instanceof Error ? error.message : "Could not delete this failed document."
        )
        toast.error("Delete failed. Try again.")
      } finally {
        setPendingDocumentAction(null)
      }
    },
    [handleLifecycleComplete, router]
  )

  const effectiveDocuments = useMemo(
    () =>
      documents.map((document) => {
        const override = lifecycleStatusOverrides[document.id]

        if (!override) return document

        return {
          ...document,
          status: override.status,
          archivedAt:
            override.status === "archived"
              ? (document.archivedAt ?? override.timestamp)
              : document.archivedAt,
          deletedAt:
            override.status === "deleted"
              ? (document.deletedAt ?? override.timestamp)
              : document.deletedAt,
          canDownloadOriginal: override.status === "deleted" ? false : document.canDownloadOriginal,
        }
      }),
    [documents, lifecycleStatusOverrides]
  )

  const selectedDocument = selectedDocumentId
    ? (effectiveDocuments.find((document) => document.id === selectedDocumentId) ?? null)
    : null

  const filteredDocuments = useMemo(
    () =>
      [...effectiveDocuments]
        .filter((document) => {
          return (
            statusFilter === "all" ||
            (statusFilter === "active" &&
              document.status !== "archived" &&
              document.status !== "deleted") ||
            document.status === statusFilter
          )
        })
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    [effectiveDocuments, statusFilter]
  )

  const selectedDocuments = useMemo(
    () => effectiveDocuments.filter((document) => selectedIds.has(document.id)),
    [effectiveDocuments, selectedIds]
  )
  const archiveableSelectedDocuments = useMemo(
    () => selectedDocuments.filter(canBulkArchiveDocument),
    [selectedDocuments]
  )
  const deletableSelectedDocuments = useMemo(
    () => selectedDocuments.filter(canBulkDeleteDocument),
    [selectedDocuments]
  )

  const canArchiveSelectedDocuments = archiveableSelectedDocuments.length > 0
  const canDeleteSelectedDocuments = deletableSelectedDocuments.length > 0

  const handleBulkArchiveDocuments = useCallback(async () => {
    if (!canArchiveSelectedDocuments) return

    const skippedCount = selectedDocuments.length - archiveableSelectedDocuments.length
    const confirmed = window.confirm(
      `Archive ${archiveableSelectedDocuments.length} selected document(s)?${
        skippedCount > 0 ? ` ${skippedCount} ineligible selected document(s) will be skipped.` : ""
      }`
    )

    if (!confirmed) {
      return
    }

    setDocumentActionError(null)
    setBulkDocumentAction("archive")

    try {
      for (const document of archiveableSelectedDocuments) {
        const result = await archiveDocument(document.id)
        handleLifecycleComplete(result.documentId, result.status)
      }

      toast.success(`${archiveableSelectedDocuments.length} document(s) archived.`, {
        description: skippedCount > 0 ? `${skippedCount} selected document(s) skipped.` : undefined,
      })
      clearSelection()
      router.refresh()
    } catch (error) {
      setDocumentActionError(
        error instanceof Error ? error.message : "Could not archive selected documents."
      )
      toast.error("Bulk archive failed. Try again.")
    } finally {
      setBulkDocumentAction(null)
    }
  }, [
    archiveableSelectedDocuments,
    canArchiveSelectedDocuments,
    clearSelection,
    handleLifecycleComplete,
    router,
    selectedDocuments,
  ])

  const handleBulkDeleteDocuments = useCallback(async () => {
    if (!canDeleteSelectedDocuments) return

    const skippedCount = selectedDocuments.length - deletableSelectedDocuments.length
    const confirmed = window.confirm(
      `Delete ${deletableSelectedDocuments.length} selected document(s)?${
        skippedCount > 0 ? ` ${skippedCount} ineligible selected document(s) will be skipped.` : ""
      }`
    )

    if (!confirmed) {
      return
    }

    setDocumentActionError(null)
    setBulkDocumentAction("delete")

    try {
      for (const document of deletableSelectedDocuments) {
        const result = await permanentlyDeleteDocument({
          documentId: document.id,
          deletionReason: "Bulk deleted from the documents table.",
        })
        handleLifecycleComplete(result.documentId, result.status)
      }

      toast.success(`${deletableSelectedDocuments.length} document(s) deleted.`, {
        description: skippedCount > 0 ? `${skippedCount} selected document(s) skipped.` : undefined,
      })
      clearSelection()
      router.refresh()
    } catch (error) {
      setDocumentActionError(
        error instanceof Error ? error.message : "Could not delete selected documents."
      )
      toast.error("Bulk delete failed. Try again.")
    } finally {
      setBulkDocumentAction(null)
    }
  }, [
    canDeleteSelectedDocuments,
    clearSelection,
    deletableSelectedDocuments,
    handleLifecycleComplete,
    router,
    selectedDocuments,
  ])

  const columns = useMemo<ColumnDef<DocumentDetail>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const visibleIds = table.getRowModel().rows.map((row) => row.original.id)
          const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length
          const allVisibleSelected =
            visibleIds.length > 0 && selectedVisibleCount === visibleIds.length

          return (
            <DataTableSelectionCheckbox
              aria-label="Select all visible documents"
              checked={allVisibleSelected}
              indeterminate={selectedVisibleCount > 0 && !allVisibleSelected}
              disabled={visibleIds.length === 0}
              onCheckedChange={(checked) => selectAll(visibleIds, checked)}
            />
          )
        },
        enableSorting: false,
        meta: { width: 56, headerClassName: "text-center", cellClassName: "text-center" },
        cell: ({ row }) => (
          <DataTableSelectionCheckbox
            aria-label={`Select ${row.original.title}`}
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggle(row.original.id)}
          />
        ),
      },
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Document" />,
        enableSorting: true,
        meta: { width: 280 },
        cell: ({ row }) => (
          <DocumentTitleCell document={row.original} onOpenDrawer={handleOpenDrawer} />
        ),
      },
      {
        id: "status",
        accessorFn: (document) => STATUS_LABELS[document.status],
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        enableSorting: true,
        meta: { width: 160 },
        cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
      },
      {
        id: "topics",
        header: "AI Topics",
        enableSorting: false,
        meta: { width: 140 },
        cell: ({ row }) =>
          row.original.status === "failed" ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <p className="typography-small font-medium text-foreground">
              {row.original.topics.length} topics
            </p>
          ),
      },
      {
        id: "description",
        header: "Extracted Text",
        enableSorting: false,
        meta: { width: 300 },
        cell: ({ row }) =>
          row.original.status === "failed" ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <p className="typography-small block truncate text-muted-foreground">
              {row.original.description}
            </p>
          ),
      },
      {
        id: "tests",
        header: "Tests",
        enableSorting: false,
        meta: { width: 120 },
        cell: ({ row }) => (
          <p className="typography-small font-medium text-foreground">
            {row.original.linkedTests.length}
          </p>
        ),
      },
      {
        id: "uploadedAt",
        accessorKey: "uploadedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        enableSorting: true,
        meta: { width: 160 },
        cell: ({ row }) => (
          <p className="typography-small whitespace-nowrap text-muted-foreground">
            {formatRelativeDate(row.original.uploadedAt)}
          </p>
        ),
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        meta: { width: 180, headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <DocumentActionsCell
            document={row.original}
            pendingDocumentAction={pendingDocumentAction}
            onRetry={handleRetryFailedDocument}
            onDelete={handleDeleteFailedDocument}
            onOpenDrawer={handleOpenDrawer}
          />
        ),
      },
    ],
    [
      handleDeleteFailedDocument,
      handleOpenDrawer,
      handleRetryFailedDocument,
      pendingDocumentAction,
      selectAll,
      selectedIds,
      toggle,
    ]
  )

  return (
    <>
      <DataTableShell
        icon={FileText}
        title="All Documents"
        countLabel={`${effectiveDocuments.length} total`}
      >
        <DataTableBulkActions selectedCount={selectedIds.size}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canArchiveSelectedDocuments || bulkDocumentAction !== null}
            onClick={() => void handleBulkArchiveDocuments()}
          >
            <Archive />
            {bulkDocumentAction === "archive" ? "Archiving..." : "Archive"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canDeleteSelectedDocuments || bulkDocumentAction !== null}
            onClick={() => void handleBulkDeleteDocuments()}
          >
            <Trash2 />
            {bulkDocumentAction === "delete" ? "Deleting..." : "Delete"}
          </Button>
        </DataTableBulkActions>
        {documentActionError ? (
          <div className="border-b border-border/50 bg-red-50 px-4 py-3 text-sm text-red-700">
            {documentActionError}
          </div>
        ) : null}
        <DataTable
          columns={columns}
          data={filteredDocuments}
          searchKey="title"
          searchPlaceholder="Search documents..."
          emptyMessage="No documents match the current filters."
          toolbar={
            <div className="relative shrink-0">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-8 w-full appearance-none rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute top-2 left-3 size-4 text-muted-foreground" />
            </div>
          }
          getRowProps={(row) => ({
            onClick: () => handleOpenDrawer(row.original),
            className: "group cursor-pointer hover:bg-muted/30 transition-colors",
          })}
        />
      </DataTableShell>
      <DocumentDrawer
        document={selectedDocument}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onLifecycleComplete={handleLifecycleComplete}
      />
    </>
  )
}

const DocumentTitleCell = memo(function DocumentTitleCell({
  document,
  onOpenDrawer,
}: {
  document: DocumentDetail
  onOpenDrawer: (document: DocumentDetail) => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpenDrawer(document)
      }}
      className="flex items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <DocumentFileIcon fileType={document.fileType} />
      <div className="flex flex-col">
        <span className="typography-small line-clamp-1 font-medium text-foreground transition-colors group-hover:text-primary">
          {document.title}
        </span>
        <span className="typography-small mt-0.5 text-xs text-muted-foreground">
          {formatFileSize(document.fileSizeMb)}
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <Badge variant="outline" className="w-fit text-[10px]">
            v{document.versionNumber ?? document.versions[0]?.version ?? 1}
          </Badge>
          {document.isLatestVersion === false ? (
            <Badge variant="secondary" className="w-fit text-[10px]">
              Old
            </Badge>
          ) : (
            <Badge className="w-fit bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-50">
              Latest
            </Badge>
          )}
        </span>
      </div>
    </button>
  )
})

const DocumentActionsCell = memo(function DocumentActionsCell({
  document,
  pendingDocumentAction,
  onRetry,
  onDelete,
  onOpenDrawer,
}: {
  document: DocumentDetail
  pendingDocumentAction: PendingDocumentAction | null
  onRetry: (documentId: string) => Promise<void>
  onDelete: (documentId: string) => Promise<void>
  onOpenDrawer: (document: DocumentDetail) => void
}) {
  const isFailed = document.status === "failed"
  const isProcessing = document.status === "processing"
  const isGeneratable = canGenerateTest(document)
  const isRetryPending =
    pendingDocumentAction?.documentId === document.id && pendingDocumentAction.action === "retry"
  const isDeletePending =
    pendingDocumentAction?.documentId === document.id && pendingDocumentAction.action === "delete"
  const hasPendingAction = pendingDocumentAction !== null

  return (
    <div
      className="flex items-center justify-end gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {isFailed ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={hasPendingAction}
            onClick={() => void onRetry(document.id)}
          >
            {isRetryPending ? "Retrying..." : "Retry"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-destructive/20 text-destructive hover:bg-destructive/10"
            disabled={hasPendingAction}
            aria-label="Delete failed document"
            onClick={() => void onDelete(document.id)}
          >
            {isDeletePending ? (
              <span className="size-3 animate-pulse rounded-full bg-current" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </>
      ) : isProcessing ? (
        <Button
          variant="secondary"
          size="sm"
          className="h-8 border border-orange-200 bg-orange-50 text-xs text-orange-600 hover:bg-orange-100 dark:border-orange-900/30 dark:bg-orange-900/20 dark:text-orange-400"
          disabled
        >
          Processing...
        </Button>
      ) : isGeneratable ? (
        <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium">
          <Link href={`/admin/documents/${document.id}/generate-test`}>Generate Test</Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-medium"
          disabled
          title={getGenerateBlockReason(document)}
        >
          Generate Test
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => onOpenDrawer(document)}
      >
        <MoreVertical className="size-4" />
      </Button>
    </div>
  )
})

const DocumentFileIcon = memo(function DocumentFileIcon({
  fileType,
}: {
  fileType: DocumentFileType
}) {
  return (
    <span
      className={`inline-flex size-9 shrink-0 flex-col items-center justify-center rounded-lg ${FILE_ICON_STYLES[fileType]}`}
      aria-hidden="true"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
        {fileType}
      </span>
    </span>
  )
})

const DocumentStatusBadge = memo(function DocumentStatusBadge({
  status,
}: {
  status: DocumentStatus
}) {
  return (
    <Badge
      variant={STATUS_VARIANTS[status]}
      className={cn(
        "status-badge",
        status === "ready"
          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
          : status === "processing"
            ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30"
            : status === "failed"
              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
              : ""
      )}
    >
      {status === "ready" && <span className="mr-1 size-1.5 rounded-full bg-emerald-500" />}
      {status === "processing" && <span className="mr-1 size-1.5 rounded-full bg-orange-500" />}
      {status === "failed" && <span className="mr-1 size-1.5 rounded-full bg-red-500" />}
      {STATUS_LABELS[status]}
    </Badge>
  )
})
