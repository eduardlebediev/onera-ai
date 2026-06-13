import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const OPEN_QUESTION_GRADING_MODEL = "gpt-4.1-mini"

const OpenQuestionGradingSchema = z.object({
  isCorrect: z.boolean(),
  rationale: z.string(),
})

export type OpenQuestionGradingResult = {
  isCorrect: boolean
  rationale: string
  needsManualReview: boolean
}

export async function gradeOpenQuestionAnswer(input: {
  questionText: string
  expectedAnswer: string
  employeeAnswer: string
  explanation?: string | null
}): Promise<OpenQuestionGradingResult> {
  const trimmedEmployeeAnswer = input.employeeAnswer.trim()

  if (!trimmedEmployeeAnswer) {
    return {
      isCorrect: false,
      rationale: "No answer provided.",
      needsManualReview: false,
    }
  }

  try {
    const result = await generateObject({
      model: openai(OPEN_QUESTION_GRADING_MODEL),
      schema: OpenQuestionGradingSchema,
      prompt: [
        "Grade an employee's open-ended answer against the expected answer.",
        "Be fair: accept paraphrases and equivalent meaning, not exact wording.",
        "",
        `Question: ${input.questionText}`,
        `Expected answer: ${input.expectedAnswer}`,
        input.explanation ? `Explanation: ${input.explanation}` : "",
        `Employee answer: ${trimmedEmployeeAnswer}`,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    return {
      isCorrect: result.object.isCorrect,
      rationale: result.object.rationale,
      needsManualReview: false,
    }
  } catch (error) {
    console.warn("Open question AI grading failed:", error)
    return {
      isCorrect: false,
      rationale: "AI grading failed — needs manual review.",
      needsManualReview: true,
    }
  }
}
