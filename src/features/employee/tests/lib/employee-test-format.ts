export function formatEstimatedTime(minutes: number): string {
  return minutes === 1 ? "~1 min" : `~${minutes} min`
}

export function formatEmployeeTestDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline"

  return new Date(deadline).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
