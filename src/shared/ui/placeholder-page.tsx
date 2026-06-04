import type { LucideIcon } from "lucide-react"

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground ml-12">{description}</p>

      <div className="mt-8 flex-1 rounded-xl border border-border bg-card flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Content coming soon</p>
      </div>
    </div>
  )
}
