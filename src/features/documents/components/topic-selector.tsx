"use client"

import { Check, Plus } from "lucide-react"

import { type MockDocumentDetail } from "@/data/mock/documents"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { getGenerateTestTopics, getTopicSummary } from "./generate-test-model"

interface TopicSelectorProps {
  document: MockDocumentDetail
  selectedTopics: string[]
  onToggleTopic: (topic: string) => void
}

export function TopicSelector({ document, selectedTopics, onToggleTopic }: TopicSelectorProps) {
  const topics = getGenerateTestTopics(document)

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border/50 px-6 py-5">
        <CardTitle className="text-base font-semibold">Selected Topics</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {topics.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic)

              return (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleTopic(topic)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    isSelected
                      ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                      : "border-border/50 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isSelected && (
                      <div className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" strokeWidth={3} />
                      </div>
                    )}
                    {!isSelected && (
                      <div className="mt-0.5 size-4 rounded-full border border-border/70 bg-background" />
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{topic}</p>
                      <p className="typography-small line-clamp-2 text-muted-foreground">
                        {getTopicSummary(document, topic)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Plus className="size-4" />
              Add Topic
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
            No detected topics are available for this document yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
