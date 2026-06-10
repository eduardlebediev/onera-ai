import Link from "next/link"

import type { SavedTestDetail } from "@/features/tests/lib/supabase-test-detail"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface SavedTestDetailPageProps {
  test: SavedTestDetail
}

function formatLanguage(language: string): string {
  return language === "de" ? "German" : "English"
}

function getCorrectOptionTexts(question: SavedTestDetail["questions"][number]): string[] {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]))

  return question.correctAnswer.optionIds
    .map((optionId) => optionById.get(optionId))
    .filter((text): text is string => Boolean(text))
}

export function SavedTestDetailPage({ test }: SavedTestDetailPageProps) {
  return (
    <div className="page-shell-narrow">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="typography-h1">{test.title}</h1>
            {test.description ? (
              <p className="typography-p text-muted-foreground">{test.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {test.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {test.difficulty}
              </Badge>
              <Badge variant="outline">{formatLanguage(test.language)}</Badge>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/admin/tests">Back to Tests</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Test Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Passing score:</span> {test.passingScore}%
            </p>
            <p>
              <span className="font-medium">Question count:</span> {test.questionCount}
            </p>
            <p>
              <span className="font-medium">Target role:</span> {test.targetRole ?? "Not specified"}
            </p>
            <p>
              <span className="font-medium">Source document:</span>{" "}
              {test.sourceDocumentTitle ?? "Unknown document"}
            </p>
            {test.publishedAt ? (
              <p className="md:col-span-2">
                <span className="font-medium">Published at:</span>{" "}
                {new Date(test.publishedAt).toLocaleString()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {test.questions.map((question, index) => {
          const correctTexts = getCorrectOptionTexts(question)

          return (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Question {index + 1}
                  {question.topic ? (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      · {question.topic}
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-medium">{question.questionText}</p>
                <ul className="space-y-1">
                  {question.options.map((option) => (
                    <li
                      key={option.id}
                      className={
                        correctTexts.includes(option.text)
                          ? "font-medium text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground"
                      }
                    >
                      {option.text}
                    </li>
                  ))}
                </ul>
                {question.explanation ? (
                  <p>
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
