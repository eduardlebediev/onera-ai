"use client"

import { memo, useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Archive, ClipboardList, Filter, Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { TestDrawer } from "@/features/tests/components/test-drawer"
import { TestsKpiSection } from "@/features/tests/components/tests-kpi-section"
import { formatTestDate } from "@/features/tests/lib/test-format"
import { archiveTest, deleteTest } from "@/features/tests/lib/test-lifecycle-api-client"
import type { ResolvedTestListItem } from "@/features/tests/lib/test-source-document"
import {
  isSourceBlockingValidity,
  normalizeTestSourceValidity,
  TEST_SOURCE_VALIDITY_STYLE,
  getTestSourceValidityLabel,
} from "@/features/tests/lib/test-source-validity-style"
import { getTestStatusLabel, TEST_STATUS_STYLE } from "@/features/tests/lib/test-status-style"
import { useTranslation } from "@/shared/i18n/use-translation"
import type { TestStatus } from "@/features/tests/types/test"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { DataTableBulkActions } from "@/shared/ui/data-table-bulk-actions"
import { DataTable } from "@/shared/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/shared/ui/data-table/data-table-column-header"
import { DataTableSelectionCheckbox } from "@/shared/ui/data-table-selection-checkbox"
import { DataTableShell } from "@/shared/ui/data-table-shell"
import { useSelection } from "@/shared/ui/use-selection"

type StatusFilter = "all" | TestStatus

interface TestsListPageProps {
  tests: ResolvedTestListItem[]
  loadError?: boolean
  newTestHref: string
}

type BulkTestAction = "archive" | "delete"

function TestsEmptyState({ newTestHref }: { newTestHref: string }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div>
          <p className="typography-h3 font-semibold">{t("tests.list.emptyTitle")}</p>
          <p className="mt-2 max-w-md typography-p text-muted-foreground">
            {t("tests.list.emptySubtitle")}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={newTestHref}>
            <Sparkles className="size-4" />
            {t("admin.dashboard.generateTest")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TestsLoadErrorState() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="typography-h3 font-semibold">{t("common.loadError.tests")}</p>
        <p className="max-w-md typography-p text-muted-foreground">{t("common.refreshHint")}</p>
      </CardContent>
    </Card>
  )
}

export function TestsListPage({ tests, loadError = false, newTestHref }: TestsListPageProps) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const { selectedIds, toggle, selectAll, clearSelection } = useSelection()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkTestAction, setBulkTestAction] = useState<BulkTestAction | null>(null)

  const visibleTests = useMemo(() => {
    if (statusFilter === "all") return tests
    return tests.filter((test) => test.status === statusFilter)
  }, [tests, statusFilter])

  const selectedTest = selectedTestId
    ? (tests.find((test) => test.id === selectedTestId) ?? null)
    : null

  const handleOpenDrawer = useCallback((test: ResolvedTestListItem) => {
    setSelectedTestId(test.id)
    setIsDrawerOpen(true)
  }, [])

  const selectedTests = useMemo(
    () => tests.filter((test) => selectedIds.has(test.id)),
    [selectedIds, tests]
  )
  const canArchiveSelectedTests =
    selectedTests.length > 0 && selectedTests.every((test) => test.status === "published")
  const canDeleteSelectedTests =
    selectedTests.length > 0 &&
    selectedTests.every((test) => test.status === "draft" || test.status === "archived")

  const statusFilterOptions = useMemo(
    () =>
      [
        { label: t("common.all"), value: "all" as const },
        { label: t("dataTable.filters.draft"), value: "draft" as const },
        { label: t("dataTable.filters.published"), value: "published" as const },
        { label: t("dataTable.filters.archived"), value: "archived" as const },
      ] satisfies Array<{ label: string; value: StatusFilter }>,
    [t]
  )

  const handleBulkArchiveTests = useCallback(async () => {
    if (!canArchiveSelectedTests) return

    const confirmed = window.confirm(`Archive ${selectedTests.length} selected test(s)?`)

    if (!confirmed) {
      return
    }

    setBulkTestAction("archive")

    try {
      for (const test of selectedTests) {
        await archiveTest(test.id)
      }

      toast.success(`${selectedTests.length} test(s) archived.`)
      clearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk archive failed.")
    } finally {
      setBulkTestAction(null)
    }
  }, [canArchiveSelectedTests, clearSelection, router, selectedTests])

  const handleBulkDeleteTests = useCallback(async () => {
    if (!canDeleteSelectedTests) return

    const confirmed = window.confirm(`Delete ${selectedTests.length} selected test(s)?`)

    if (!confirmed) {
      return
    }

    setBulkTestAction("delete")

    try {
      for (const test of selectedTests) {
        await deleteTest({
          testId: test.id,
          deletionReason: "Bulk deleted from the tests table.",
        })
      }

      toast.success(`${selectedTests.length} test(s) deleted.`)
      clearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk delete failed.")
    } finally {
      setBulkTestAction(null)
    }
  }, [canDeleteSelectedTests, clearSelection, router, selectedTests])

  const columns = useMemo<ColumnDef<ResolvedTestListItem>[]>(
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
              aria-label={t("dataTable.selectAllTests")}
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
            aria-label={t("dataTable.selectTest", { title: row.original.title })}
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggle(row.original.id)}
          />
        ),
      },
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.title")} />
        ),
        enableSorting: true,
        meta: { width: 240 },
        cell: ({ row }) => <TestTitleCell test={row.original} onOpenDrawer={handleOpenDrawer} />,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.status")} />
        ),
        enableSorting: true,
        meta: { width: 220 },
        cell: ({ row }) => <TestStatusCell test={row.original} />,
      },
      {
        id: "difficulty",
        accessorKey: "difficulty",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.difficulty")} />
        ),
        enableSorting: true,
        meta: { width: 140 },
        cell: ({ row }) => (
          <span className="capitalize">{t(`common.difficulty.${row.original.difficulty}`)}</span>
        ),
      },
      {
        id: "targetRole",
        accessorKey: "targetRole",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.targetRole")} />
        ),
        enableSorting: true,
        meta: { width: 180 },
      },
      {
        id: "language",
        accessorKey: "language",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.language")} />
        ),
        enableSorting: true,
        meta: { width: 120 },
      },
      {
        id: "questionCount",
        accessorKey: "questionCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("common.questions")} />
        ),
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "passingScore",
        accessorKey: "passingScore",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.passingScore")} />
        ),
        enableSorting: true,
        meta: { width: 160 },
        cell: ({ row }) => `${row.original.passingScore}%`,
      },
      {
        id: "sourceDocument",
        accessorFn: (test) => test.sourceDocument.title,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.sourceDocument")} />
        ),
        enableSorting: true,
        meta: { width: 220 },
        cell: ({ row }) => (
          <p className="typography-small truncate text-muted-foreground">
            {row.original.sourceDocument.title}
          </p>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.created")} />
        ),
        enableSorting: true,
        meta: { width: 140 },
        cell: ({ row }) => (
          <p className="typography-small whitespace-nowrap text-muted-foreground">
            {formatTestDate(locale, row.original.createdAt)}
          </p>
        ),
      },
      {
        id: "assignedEmployeesCount",
        accessorKey: "assignedEmployeesCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.assigned")} />
        ),
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "attemptsCount",
        accessorKey: "attemptsCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("dataTable.attempts")} />
        ),
        enableSorting: true,
        meta: { width: 130 },
      },
      {
        id: "actions",
        header: t("common.action"),
        enableSorting: false,
        meta: { width: 150, headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => <TestActionsCell testId={row.original.id} />,
      },
    ],
    [handleOpenDrawer, locale, selectAll, selectedIds, t, toggle]
  )

  return (
    <div className="page-shell">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="typography-h2">{t("tests.list.title")}</h2>
          <p className="mt-1 typography-p text-muted-foreground">{t("tests.list.subtitle")}</p>
        </div>
        <Button asChild className="shrink-0" size="lg">
          <Link href={newTestHref}>
            <Sparkles className="size-4" />
            {t("tests.list.newTest")}
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <TestsKpiSection tests={tests} />
      </div>

      <div className="mt-2">
        {loadError ? (
          <TestsLoadErrorState />
        ) : tests.length === 0 ? (
          <TestsEmptyState newTestHref={newTestHref} />
        ) : (
          <DataTableShell
            icon={ClipboardList}
            title={t("dataTable.allTests")}
            countLabel={t("common.shown", { count: visibleTests.length })}
          >
            <DataTableBulkActions selectedCount={selectedIds.size}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canArchiveSelectedTests || bulkTestAction !== null}
                onClick={() => void handleBulkArchiveTests()}
              >
                <Archive />
                {bulkTestAction === "archive" ? t("common.archiving") : t("common.archive")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canDeleteSelectedTests || bulkTestAction !== null}
                onClick={() => void handleBulkDeleteTests()}
              >
                <Trash2 />
                {bulkTestAction === "delete" ? t("common.deleting") : t("common.delete")}
              </Button>
            </DataTableBulkActions>
            <DataTable
              columns={columns}
              data={visibleTests}
              searchKey="title"
              searchPlaceholder={t("dataTable.searchTests")}
              emptyMessage={t("dataTable.emptyTests")}
              toolbar={
                <div className="relative shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-8 w-full appearance-none rounded-lg border border-border/50 bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {statusFilterOptions.map((option) => (
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
        )}
      </div>
      <TestDrawer test={selectedTest} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  )
}

const TestTitleCell = memo(function TestTitleCell({
  test,
  onOpenDrawer,
}: {
  test: ResolvedTestListItem
  onOpenDrawer: (test: ResolvedTestListItem) => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpenDrawer(test)
      }}
      className="typography-small line-clamp-1 text-left font-medium text-foreground transition-colors group-hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {test.title}
    </button>
  )
})

const TestActionsCell = memo(function TestActionsCell({ testId }: { testId: string }) {
  const { t } = useTranslation()

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Button asChild variant="outline" size="sm" className="h-8 text-xs">
        <Link href={`/admin/tests/${testId}`}>{t("tests.list.viewDetails")}</Link>
      </Button>
    </div>
  )
})

const TestStatusCell = memo(function TestStatusCell({ test }: { test: ResolvedTestListItem }) {
  const { t } = useTranslation()
  const statusStyle = TEST_STATUS_STYLE[test.status]
  const sourceValidity = normalizeTestSourceValidity(test.sourceValidity)
  const sourceValidityStyle = TEST_SOURCE_VALIDITY_STYLE[sourceValidity]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={cn("status-badge", statusStyle.listBadgeClass)}>
        <span className={`mr-1 size-1.5 rounded-full ${statusStyle.dotClass}`} />
        {getTestStatusLabel(test.status, t)}
      </Badge>
      {test.isActive === false ? (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          {t("status.test.inactive")}
        </Badge>
      ) : null}
      {isSourceBlockingValidity(sourceValidity) ? (
        <Badge variant="outline" className={sourceValidityStyle.badgeClass}>
          {getTestSourceValidityLabel(sourceValidity, t)}
        </Badge>
      ) : null}
    </div>
  )
})
