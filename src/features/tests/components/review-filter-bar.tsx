import { Settings } from "lucide-react"

import type { ReviewStatus } from "@/features/tests/types/review"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"

export type ReviewStatusFilter = "all" | ReviewStatus

interface ReviewFilterBarProps {
  totalQuestions: number
  approvedCount: number
  editedCount: number
  rejectedCount: number
  activeTab: ReviewStatusFilter
  onTabChange: (tab: ReviewStatusFilter) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  topics: string[]
  topicFilter: string
  onTopicFilterChange: (topic: string) => void
}

export function ReviewFilterBar({
  totalQuestions,
  approvedCount,
  editedCount,
  rejectedCount,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  topics,
  topicFilter,
  onTopicFilterChange,
}: ReviewFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/50 pb-4 md:flex-row md:items-center md:justify-between">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as ReviewStatusFilter)}
        className="w-full md:w-auto"
      >
        <TabsList className="border-b-0">
          <TabsTrigger value="all" className="gap-2">
            All Questions
            <Badge variant="secondary" className="h-5 rounded-full px-1.5 font-normal">
              {totalQuestions}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approved
            <Badge
              variant="outline"
              className="h-5 rounded-full border-green-200 bg-green-50 px-1.5 font-normal text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
            >
              {approvedCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="edited" className="gap-2">
            Edited
            <Badge
              variant="outline"
              className="h-5 rounded-full border-blue-200 bg-blue-50 px-1.5 font-normal text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {editedCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejected
            <Badge
              variant="outline"
              className="h-5 rounded-full border-red-200 bg-red-50 px-1.5 font-normal text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
            >
              {rejectedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full md:w-64">
          <label htmlFor="review-search" className="sr-only">
            Search questions
          </label>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            id="review-search"
            placeholder="Search questions..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {topics.length > 0 && (
          <div className="relative">
            <label htmlFor="review-topic-filter" className="sr-only">
              Filter by topic
            </label>
            <select
              id="review-topic-filter"
              value={topicFilter}
              onChange={(e) => onTopicFilterChange(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All Topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-muted-foreground"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        )}

        <button
          disabled
          title="Advanced filters are not available in this demo"
          aria-label="Advanced filters are not available in this demo"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground shadow-sm opacity-50 cursor-not-allowed"
        >
          <Settings className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
