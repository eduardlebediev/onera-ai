"use client"

import { useCallback, useMemo, useState, type ChangeEvent } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  MoreVertical,
  Search,
  Trash2,
} from "lucide-react"

import { type DocumentStatus, type MockDocumentDetail } from "@/data/mock/documents"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Typography } from "@/shared/ui/typography"
import { DocumentDrawer } from "./document-drawer"

type StatusFilter = "all" | DocumentStatus
type SortKey = "title" | "status" | "uploadedAt"
type SortDirection = "asc" | "desc"
type DocumentFileType = "pdf" | "docx" | "pptx" | "txt"

const STATUS_LABELS: Record<DocumentStatus, string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
  uploaded: "Uploaded",
}

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Ready", value: "ready" },
  { label: "Processing", value: "processing" },
  { label: "Failed", value: "failed" },
  { label: "Uploaded", value: "uploaded" },
]

const STATUS_VARIANTS: Record<DocumentStatus, "default" | "secondary" | "destructive" | "outline"> =
  {
    ready: "default",
    processing: "secondary",
    failed: "destructive",
    uploaded: "outline",
  }

const FILE_TYPE_BY_DOCUMENT_ID: Record<string, DocumentFileType> = {
  "doc-1": "pdf",
  "doc-2": "docx",
  "doc-3": "pdf",
  "doc-4": "docx",
  "doc-5": "pdf",
}

const FILE_ICON_STYLES: Record<DocumentFileType, string> = {
  pdf: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30",
  docx: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30",
  pptx: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30",
  txt: "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800",
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date("2024-06-20") // Mock current date relative to the mock data
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

function getDocumentFileType(document: MockDocumentDetail): DocumentFileType {
  return FILE_TYPE_BY_DOCUMENT_ID[document.id] ?? "txt"
}

interface DocumentsTableProps {
  documents: MockDocumentDetail[]
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("uploadedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedDocument, setSelectedDocument] = useState<MockDocumentDetail | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleOpenDrawer = useCallback((document: MockDocumentDetail) => {
    setSelectedDocument(document)
    setIsDrawerOpen(true)
  }, [])

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleStatusFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as StatusFilter)
  }, [])

  const toggleSort = useCallback((nextSortKey: SortKey) => {
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"))
        return currentSortKey
      }

      setSortDirection("asc")
      return nextSortKey
    })
  }, [])

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return [...documents]
      .filter((document) => {
        const matchesSearch = document.title.toLowerCase().includes(normalizedQuery)
        const matchesStatus = statusFilter === "all" || document.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let comparison = 0

        if (sortKey === "title") {
          comparison = a.title.localeCompare(b.title)
        } else if (sortKey === "status") {
          comparison = STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status])
        } else {
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        }

        return sortDirection === "asc" ? comparison : -comparison
      })
  }, [documents, searchQuery, sortDirection, sortKey, statusFilter])

  return (
    <Card className="border-none shadow-none bg-transparent">
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="border-b border-border/50 px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-muted-foreground" />
              <Typography variant="h3" className="font-semibold">
                All Documents
              </Typography>
              <Typography variant="small" className="text-muted-foreground ml-2">
                {documents.length} total
              </Typography>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search documents..."
                  className="pl-9 bg-background border-border/50 rounded-lg h-9"
                />
              </div>
              <div className="relative shrink-0">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="h-9 w-full appearance-none rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <SortableTableHead
                label="Document"
                sortKey="title"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <SortableTableHead
                label="Status"
                sortKey="status"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <TableHead className="text-xs font-medium text-muted-foreground">AI Topics</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Extracted Text
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Assessments
              </TableHead>
              <SortableTableHead
                label="Updated"
                sortKey="uploadedAt"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <TableHead className="text-right text-xs font-medium text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDocuments.length > 0 ? (
              visibleDocuments.map((document) => {
                const isFailed = document.status === "failed"
                const isProcessing = document.status === "processing"

                return (
                  <TableRow key={document.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(document)}
                        className="flex items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <DocumentFileIcon fileType={getDocumentFileType(document)} />
                        <div className="flex flex-col">
                          <Typography
                            variant="small"
                            as="span"
                            className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1"
                          >
                            {document.title}
                          </Typography>
                          <Typography
                            variant="small"
                            as="span"
                            className="text-xs text-muted-foreground mt-0.5"
                          >
                            2.4 MB
                          </Typography>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant={STATUS_VARIANTS[document.status]}
                        className={`text-[11px] font-medium rounded-md px-2 py-0.5 ${
                          document.status === "ready"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            : document.status === "processing"
                              ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30"
                              : document.status === "failed"
                                ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                : ""
                        }`}
                      >
                        {document.status === "ready" && (
                          <span className="mr-1 size-1.5 rounded-full bg-emerald-500" />
                        )}
                        {document.status === "processing" && (
                          <span className="mr-1 size-1.5 rounded-full bg-orange-500" />
                        )}
                        {document.status === "failed" && (
                          <span className="mr-1 size-1.5 rounded-full bg-red-500" />
                        )}
                        {STATUS_LABELS[document.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {isFailed ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <Typography variant="small" className="font-medium text-foreground">
                          {document.topicsCount} topics
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className="py-4 w-[300px] max-w-[300px]">
                      {isFailed ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <Typography
                          variant="small"
                          className="text-muted-foreground truncate block"
                        >
                          {document.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <Typography variant="small" className="font-medium text-foreground">
                        {document.linkedTests.length}
                      </Typography>
                    </TableCell>
                    <TableCell className="py-4">
                      <Typography
                        variant="small"
                        className="text-muted-foreground whitespace-nowrap"
                      >
                        {formatRelativeDate(document.uploadedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isFailed ? (
                          <>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              Retry
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        ) : isProcessing ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30"
                            disabled
                          >
                            Processing...
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                            Generate Assessment
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => handleOpenDrawer(document)}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Typography variant="muted">No documents match the current filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 bg-muted/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <select className="h-8 rounded-md border border-border/50 bg-background px-2 text-foreground outline-none">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" disabled>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-md bg-muted font-medium">
              1
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-md text-muted-foreground">
              2
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-md text-muted-foreground">
              3
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <DocumentDrawer
        document={selectedDocument}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </Card>
  )
}

function DocumentFileIcon({ fileType }: { fileType: DocumentFileType }) {
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
}

interface SortableTableHeadProps {
  label: string
  sortKey: SortKey
  activeSortKey: SortKey
  sortDirection: SortDirection
  onSort: (sortKey: SortKey) => void
}

function SortableTableHead({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
}: SortableTableHeadProps) {
  const isActive = activeSortKey === sortKey
  const SortIcon = !isActive ? ArrowUpDown : sortDirection === "asc" ? ArrowUp : ArrowDown

  const handleClick = useCallback(() => {
    onSort(sortKey)
  }, [onSort, sortKey])

  return (
    <TableHead>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <SortIcon className="size-3" />
      </button>
    </TableHead>
  )
}
