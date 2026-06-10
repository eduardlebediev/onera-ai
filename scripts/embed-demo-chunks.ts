import { loadEnvConfig } from "@next/env"
import OpenAI from "openai"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"

const EMBEDDING_MODEL = "text-embedding-3-small"

const VERIFICATION_QUERIES = [
  {
    label: "phishing email",
    query: "What should an employee do when they receive a phishing email?",
    expectedTitle: "Phishing Response",
    expectedTopic: "Incident Reporting",
  },
  {
    label: "P1 incident",
    query: "When should support escalate a P1 incident?",
    expectedTitle: "Severity Levels",
    expectedTopic: "Incident Triage",
  },
] as const

type DocumentChunk = {
  id: string
  document_id: string
  organization_id: string
  title: string | null
  topic: string | null
  content: string
  metadata: Json
}

function loadEnvironment(): void {
  loadEnvConfig(process.cwd())
}

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function buildEmbeddingInput(chunk: Pick<DocumentChunk, "title" | "topic" | "content">): string {
  const lines: string[] = []

  if (chunk.title) {
    lines.push(`Title: ${chunk.title}`)
  }

  if (chunk.topic) {
    lines.push(`Topic: ${chunk.topic}`)
  }

  lines.push("Content:", chunk.content)

  return lines.join("\n")
}

function mergeMetadata(existing: Json, patch: Record<string, Json>): Json {
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return { ...existing, ...patch }
  }

  return patch
}

function previewContent(content: string, maxLength = 120): string {
  const normalized = content.replace(/\s+/g, " ").trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...`
}

async function createEmbedding(openai: OpenAI, input: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  })

  const embedding = response.data[0]?.embedding

  if (!embedding || embedding.length === 0) {
    throw new Error("OpenAI returned no embedding")
  }

  return embedding
}

async function fetchChunksWithoutEmbeddings(): Promise<DocumentChunk[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, organization_id, title, topic, content, metadata")
    .is("embedding", null)
    .order("document_id", { ascending: true })
    .order("chunk_index", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch document chunks: ${error.message}`)
  }

  return (data ?? []) as DocumentChunk[]
}

async function embedChunks(
  openai: OpenAI,
  chunks: DocumentChunk[]
): Promise<{ updated: number; failed: number }> {
  const supabase = createAdminClient()
  let updated = 0
  let failed = 0

  for (const [index, chunk] of chunks.entries()) {
    const position = index + 1

    try {
      const input = buildEmbeddingInput(chunk)
      const embedding = await createEmbedding(openai, input)
      const embeddedAt = new Date().toISOString()
      const metadata = mergeMetadata(chunk.metadata, {
        embedding_model: EMBEDDING_MODEL,
        embedded_at: embeddedAt,
      })

      const { error } = await supabase
        .from("document_chunks")
        .update({
          embedding,
          metadata,
        })
        .eq("id", chunk.id)

      if (error) {
        throw new Error(error.message)
      }

      updated += 1
      console.log(`Embedded chunk ${position}/${chunks.length} (${chunk.id})`)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error(`Failed chunk ${position}/${chunks.length} (${chunk.id}): ${message}`)
    }
  }

  return { updated, failed }
}

async function runVerification(openai: OpenAI): Promise<void> {
  const supabase = createAdminClient()

  for (const verification of VERIFICATION_QUERIES) {
    console.log(`\nVerification query: ${verification.label}`)
    console.log(`Query: ${verification.query}`)

    const queryEmbedding = await createEmbedding(openai, verification.query)

    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 5,
      match_threshold: 0.2,
    })

    if (error) {
      throw new Error(`Verification query failed (${verification.label}): ${error.message}`)
    }

    const matches = data ?? []

    if (matches.length === 0) {
      throw new Error(`Verification query returned no matches (${verification.label})`)
    }

    for (const [index, match] of matches.entries()) {
      console.log(
        [
          `  ${index + 1}. similarity=${match.similarity.toFixed(4)}`,
          `title="${match.title ?? ""}"`,
          `topic="${match.topic ?? ""}"`,
          `preview="${previewContent(match.content)}"`,
        ].join(" | ")
      )
    }

    const topResult = matches[0]
    console.log(`Top result: ${topResult.title ?? "(no title)"}`)

    const hasExpectedTitle = matches.some((match) => match.title === verification.expectedTitle)
    const hasExpectedTopic = matches.some((match) => match.topic === verification.expectedTopic)

    if (!hasExpectedTitle || !hasExpectedTopic) {
      throw new Error(
        `Verification did not return expected chunk (${verification.label}). Expected title "${verification.expectedTitle}" and topic "${verification.expectedTopic}".`
      )
    }
  }
}

async function main(): Promise<void> {
  loadEnvironment()

  requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  requireEnv("SUPABASE_SECRET_KEY")
  requireEnv("OPENAI_API_KEY")

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const chunks = await fetchChunksWithoutEmbeddings()

  if (chunks.length === 0) {
    console.log("No chunks need embeddings.")
    console.log("Running verification only...")
  } else {
    console.log(`Found ${chunks.length} chunks without embeddings.`)

    const { updated, failed } = await embedChunks(openai, chunks)

    console.log(`\nUpdated ${updated} chunks.`)

    if (failed > 0) {
      console.error(`Failed ${failed} chunks.`)
      process.exitCode = 1
      return
    }
  }

  await runVerification(openai)
  console.log("\nEmbedding and verification completed successfully.")
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error"
  console.error(`Embedding script failed: ${message}`)
  process.exit(1)
})
