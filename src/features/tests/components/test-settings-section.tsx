import type { ReactNode } from "react"

import type { TestListItem } from "@/features/tests/types/test"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface TestSettingsSectionProps {
  test: TestListItem
}

function SettingsRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="typography-small text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function TestSettingsSection({ test }: TestSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <SettingsRow label="Question Count" value={test.questionCount} />
          <SettingsRow label="Passing Score" value={`${test.passingScore}%`} />
          <SettingsRow
            label="Difficulty"
            value={<span className="capitalize">{test.difficulty}</span>}
          />
          <SettingsRow label="Language" value={test.language} />
          <SettingsRow label="Target Role" value={test.targetRole} />
          <SettingsRow label="Selected Chunks" value={test.selectedChunksCount} />
          <div className="col-span-2">
            <SettingsRow
              label="Selected Topics"
              value={
                test.selectedTopics.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {test.selectedTopics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="font-normal">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "None selected"
                )
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
