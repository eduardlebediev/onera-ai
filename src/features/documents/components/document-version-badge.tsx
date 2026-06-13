import { Badge } from "@/shared/ui/badge"

export function DocumentVersionBadge({
  versionNumber,
  isLatest,
}: {
  versionNumber: number
  isLatest: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline">v{versionNumber}</Badge>
      {isLatest ? (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Latest</Badge>
      ) : (
        <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-50">
          Old version
        </Badge>
      )}
    </div>
  )
}
