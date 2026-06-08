export function formatEstimatedTime(minutes: number): string {
  return minutes === 1 ? "~1 min" : `~${minutes} min`
}

export function formatEmployeeTestDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getDaysUntilDeadline(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
