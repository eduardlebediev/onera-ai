"use client"

import { useCallback, useMemo, useState, type ChangeEvent } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, FileText } from "lucide-react"

import { type DocumentStatus, type MockDocumentDetail } from "@/data/mock/documents"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
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
    processing: "outline",
    failed: "destructive",
    uploaded: "secondary",
  }

const FILE_TYPE_BY_DOCUMENT_ID: Record<string, DocumentFileType> = {
  "doc-1": "pdf",
  "doc-2": "pdf",
  "doc-3": "docx",
  "doc-4": "pptx",
  "doc-5": "pdf",
}

const FILE_ICON_STYLES: Record<DocumentFileType, string> = {
  pdf: "bg-destructive/10 text-destructive",
  docx: "bg-primary/10 text-primary",
  pptx: "bg-secondary text-secondary-foreground",
  txt: "bg-muted text-muted-foreground",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
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
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <label className="sr-only" htmlFor="documents-search">
              Search documents
            </label>
            <Input
              id="documents-search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by title..."
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="sr-only" htmlFor="documents-status-filter">
              Filter by status
            </label>
            <select
              id="documents-status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="h-8 w-full rounded-lg border border-input bg-input px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                label="Title"
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
              <TableHead>Topics count</TableHead>
              <TableHead>Tests count</TableHead>
              <SortableTableHead
                label="Uploaded"
                sortKey="uploadedAt"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDocuments.length > 0 ? (
              visibleDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <DocumentDrawer
                      document={document}
                      trigger={
                        <button
                          type="button"
                          className="group inline-flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          aria-label={`Open preview for ${document.title}`}
                        >
                          <DocumentFileIcon fileType={getDocumentFileType(document)} />
                          <Typography
                            variant="small"
                            as="span"
                            className="font-semibold transition-colors group-hover:text-primary"
                          >
                            {document.title}
                          </Typography>
                        </button>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[document.status]} className="text-xs">
                      {STATUS_LABELS[document.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Typography variant="small" className="font-medium text-muted-foreground">
                      {document.topicsCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="small" className="font-medium text-muted-foreground">
                      {document.linkedTests.length}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="small" className="font-medium text-muted-foreground">
                      {formatDate(document.uploadedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell className="text-right">
                    <DocumentDrawer document={document} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Typography variant="muted">No documents match the current filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function DocumentFileIcon({ fileType }: { fileType: DocumentFileType }) {
  return (
    <span
      className={`inline-flex size-10 shrink-0 flex-col items-center justify-center rounded-xl ${FILE_ICON_STYLES[fileType]}`}
      aria-hidden="true"
    >
      <FileText className="size-4" />
      <span className="mt-0.5 text-[0.6rem] font-bold uppercase leading-none">{fileType}</span>
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <SortIcon className="size-3.5" />
      </button>
    </TableHead>
  )
}
