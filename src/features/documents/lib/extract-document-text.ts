import "server-only"

import OpenAI from "openai"

import { cleanExtractedText } from "@/features/documents/lib/clean-extracted-text"
import {
  getMimeTypeForExtension,
  NATIVE_TEXT_EXTENSIONS,
  type SupportedUploadExtension,
} from "@/features/documents/lib/document-file-types"

const EXTRACTION_PROMPT = `Extract the full readable text from this document.
Do not summarize.
Do not add information.
Preserve headings, lists, and tables where possible.
Return clean structured plain text.`

function getExtractionModel(): string {
  return process.env.DOCUMENT_TEXT_EXTRACTION_MODEL?.trim() || "gpt-4.1-mini"
}

function extractNativeText(buffer: Buffer): string {
  return buffer.toString("utf-8")
}

async function extractWithAiFileInput(input: {
  buffer: Buffer
  fileName: string
  extension: SupportedUploadExtension
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured")
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const mimeType = getMimeTypeForExtension(input.extension)
  const base64 = input.buffer.toString("base64")

  const response = await openai.responses.create({
    model: getExtractionModel(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: input.fileName,
            file_data: `data:${mimeType};base64,${base64}`,
          },
          {
            type: "input_text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  })

  const extracted = response.output_text?.trim()

  if (!extracted) {
    throw new Error("AI extraction returned no text")
  }

  return extracted
}

export async function extractDocumentText(input: {
  buffer: Buffer
  fileName: string
  extension: SupportedUploadExtension
}): Promise<string> {
  const rawText = NATIVE_TEXT_EXTENSIONS.has(input.extension)
    ? extractNativeText(input.buffer)
    : await extractWithAiFileInput(input)

  const cleaned = cleanExtractedText(rawText)

  if (!cleaned) {
    throw new Error("No readable text could be extracted from this document")
  }

  return cleaned
}
