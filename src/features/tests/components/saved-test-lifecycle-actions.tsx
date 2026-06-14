"use client"

import { Archive, Loader2, MoreHorizontal, Pencil, RotateCcw, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react"

import {
  archiveTest,
  deleteTest,
  restoreTest,
  updateTestMetadata,
  type TestLifecycleImpact,
} from "@/features/tests/lib/test-lifecycle-api-client"
import type { TestMetadataUpdateRequest } from "@/features/tests/schemas/test-lifecycle-schema"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

type PendingAction = "archive" | "delete" | null

type LifecycleStatus = "idle" | "success" | "error"

export interface SavedTestLifecycleActionsProps {
  testId: string
  title: string
  description: string | null
  status: string
  difficulty: string
  passingScore: number
  targetRole: string | null
  impact: TestLifecycleImpact
}

interface LifecycleContextValue {
  status: string
  impact: TestLifecycleImpact
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  pendingAction: PendingAction
  setPendingAction: (value: PendingAction) => void
  isSubmitting: boolean
  message: { status: LifecycleStatus; text: string } | null
  setMessage: (value: { status: LifecycleStatus; text: string } | null) => void
  deleteConfirmation: string
  setDeleteConfirmation: (value: string) => void
  deletionReason: string
  setDeletionReason: (value: string) => void
  form: {
    title: string
    description: string
    difficulty: TestMetadataUpdateRequest["difficulty"]
    passingScore: string
    targetRole: string
  }
  setForm: React.Dispatch<
    React.SetStateAction<{
      title: string
      description: string
      difficulty: TestMetadataUpdateRequest["difficulty"]
      passingScore: string
      targetRole: string
    }>
  >
  canArchive: boolean
  canRestore: boolean
  canDelete: boolean
  deleteConfirmationMatches: boolean
  resetDialog: () => void
  handleMetadataSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleRestore: () => Promise<void>
  handleConfirmAction: () => Promise<void>
}

const LifecycleContext = createContext<LifecycleContextValue | null>(null)

function useLifecycleContext() {
  const context = useContext(LifecycleContext)
  if (!context) {
    throw new Error(
      "SavedTestLifecycleActions components must be used within SavedTestLifecycleActionsProvider"
    )
  }

  return context
}

function normalizeDifficulty(value: string): TestMetadataUpdateRequest["difficulty"] {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value
  }

  return "medium"
}

function ImpactSummary({ impact }: { impact: TestLifecycleImpact }) {
  return (
    <div className="mt-4 grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm sm:grid-cols-2">
      <p>
        <span className="font-medium text-foreground">Assignments:</span> {impact.assignmentCount}
      </p>
      <p>
        <span className="font-medium text-foreground">Active assignments:</span>{" "}
        {impact.activeAssignmentCount}
      </p>
      <p>
        <span className="font-medium text-foreground">Attempts:</span> {impact.attemptCount}
      </p>
      <p>
        <span className="font-medium text-foreground">Completed attempts:</span>{" "}
        {impact.completedAttemptCount}
      </p>
    </div>
  )
}

export function SavedTestLifecycleActionsProvider({
  children,
  testId,
  title,
  description,
  status,
  difficulty,
  passingScore,
  targetRole,
  impact,
}: SavedTestLifecycleActionsProps & { children: ReactNode }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ status: LifecycleStatus; text: string } | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deletionReason, setDeletionReason] = useState("")
  const [form, setForm] = useState({
    title,
    description: description ?? "",
    difficulty: normalizeDifficulty(difficulty),
    passingScore: String(passingScore),
    targetRole: targetRole ?? "",
  })

  const canArchive = status === "published"
  const canRestore = status === "archived"
  const canDelete = status === "draft" || status === "review" || status === "archived"
  const deleteConfirmationMatches = deleteConfirmation.trim().toUpperCase() === "DELETE"

  const resetDialog = () => {
    if (isSubmitting) return
    setPendingAction(null)
    setDeleteConfirmation("")
    setDeletionReason("")
  }

  const handleMetadataSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      await updateTestMetadata(testId, {
        title: form.title,
        description: form.description || null,
        difficulty: form.difficulty,
        passingScore: Number(form.passingScore),
        targetRole: form.targetRole || null,
      })
      setMessage({ status: "success", text: "Test metadata updated." })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      setMessage({
        status: "error",
        text: error instanceof Error ? error.message : "Could not update test metadata.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestore = async () => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      await restoreTest(testId)
      setMessage({ status: "success", text: "Test restored and assignable again." })
      router.refresh()
    } catch (error) {
      setMessage({
        status: "error",
        text: error instanceof Error ? error.message : "Could not restore test.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!pendingAction || isSubmitting) return
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (pendingAction === "archive") {
        await archiveTest(testId)
        setMessage({
          status: "success",
          text: "Test archived. Active assignments remain visible but employees cannot start it.",
        })
        setPendingAction(null)
        setDeleteConfirmation("")
        setDeletionReason("")
        router.refresh()
        return
      }

      const result = await deleteTest({
        testId,
        deletionReason: deletionReason.trim() || undefined,
      })
      setMessage({
        status: "success",
        text:
          result.deleteMode === "tombstoned"
            ? "Archived test tombstoned. Historical results remain available."
            : "Test deleted.",
      })
      setPendingAction(null)
      setDeleteConfirmation("")
      setDeletionReason("")
      router.push("/admin/tests")
      router.refresh()
    } catch (error) {
      setMessage({
        status: "error",
        text: error instanceof Error ? error.message : "Could not complete this test action.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const value: LifecycleContextValue = {
    status,
    impact,
    isEditing,
    setIsEditing,
    pendingAction,
    setPendingAction,
    isSubmitting,
    message,
    setMessage,
    deleteConfirmation,
    setDeleteConfirmation,
    deletionReason,
    setDeletionReason,
    form,
    setForm,
    canArchive,
    canRestore,
    canDelete,
    deleteConfirmationMatches,
    resetDialog,
    handleMetadataSubmit,
    handleRestore,
    handleConfirmAction,
  }

  return (
    <LifecycleContext.Provider value={value}>
      {children}
      <SavedTestLifecycleActionsDialog />
    </LifecycleContext.Provider>
  )
}

export function SavedTestLifecycleActionsMenu() {
  const {
    canArchive,
    canRestore,
    canDelete,
    isSubmitting,
    setIsEditing,
    setMessage,
    setPendingAction,
    handleRestore,
  } = useLifecycleContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Test actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            setIsEditing(true)
            setMessage(null)
          }}
        >
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        {canRestore ? (
          <DropdownMenuItem disabled={isSubmitting} onSelect={() => void handleRestore()}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={!canArchive}
            title={canArchive ? undefined : "Only published tests can be archived"}
            onSelect={() => setPendingAction("archive")}
          >
            <Archive className="size-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          disabled={!canDelete}
          title={
            canDelete
              ? undefined
              : "Published tests are protected. Archive this test before deleting it."
          }
          onSelect={() => setPendingAction("delete")}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SavedTestLifecycleActionsPanel() {
  const {
    status,
    isEditing,
    isSubmitting,
    message,
    form,
    setForm,
    setIsEditing,
    handleMetadataSubmit,
  } = useLifecycleContext()

  const hasPanelContent = status === "published" || message !== null || isEditing

  if (!hasPanelContent) {
    return null
  }

  return (
    <div className="space-y-3">
      {status === "published" ? (
        <p className="text-sm text-muted-foreground">
          Published tests with attempts are protected from deletion. Archive first if this test
          should be removed from assignment.
        </p>
      ) : null}

      {message ? (
        <p
          className={
            message.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"
          }
        >
          {message.text}
        </p>
      ) : null}

      {isEditing ? (
        <form
          onSubmit={handleMetadataSubmit}
          className="grid w-full max-w-2xl gap-3 rounded-xl border border-border bg-card p-4 text-sm"
        >
          <label className="grid gap-1">
            <span className="font-medium text-foreground">Title</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              maxLength={160}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium text-foreground">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-20 rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              maxLength={1000}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="font-medium text-foreground">Difficulty</span>
              <select
                value={form.difficulty}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    difficulty: normalizeDifficulty(event.target.value),
                  }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-medium text-foreground">Passing score</span>
              <input
                type="number"
                min={1}
                max={100}
                value={form.passingScore}
                onChange={(event) =>
                  setForm((current) => ({ ...current, passingScore: event.target.value }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium text-foreground">Target role</span>
              <input
                value={form.targetRole}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetRole: event.target.value }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                maxLength={120}
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save metadata
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

function SavedTestLifecycleActionsDialog() {
  const {
    status,
    impact,
    pendingAction,
    isSubmitting,
    deleteConfirmation,
    setDeleteConfirmation,
    deletionReason,
    setDeletionReason,
    deleteConfirmationMatches,
    resetDialog,
    handleConfirmAction,
  } = useLifecycleContext()

  if (!pendingAction) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {pendingAction === "archive" ? "Archive test?" : "Delete test?"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {pendingAction === "archive"
                ? "Archiving this test hides it from future assignment and blocks employees from starting active assignments. Existing assignments and completed results are kept."
                : status === "archived"
                  ? "Archived tests with attempts are tombstoned so historical results remain available. Archived tests without attempts are removed."
                  : "Draft tests without attempts are permanently removed."}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={resetDialog}>
            <X className="size-4" />
          </Button>
        </div>

        <ImpactSummary impact={impact} />

        {pendingAction === "delete" ? (
          <div className="mt-4 space-y-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">Deletion reason (optional)</span>
              <textarea
                value={deletionReason}
                onChange={(event) => setDeletionReason(event.target.value)}
                className="min-h-20 rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                maxLength={1000}
                placeholder="Why is this test being deleted?"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">
                Type DELETE to confirm this action
              </span>
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={resetDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={pendingAction === "delete" ? "destructive" : "default"}
            onClick={handleConfirmAction}
            disabled={isSubmitting || (pendingAction === "delete" && !deleteConfirmationMatches)}
          >
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {pendingAction === "archive" ? "Archive test" : "Delete test"}
          </Button>
        </div>
      </div>
    </div>
  )
}
