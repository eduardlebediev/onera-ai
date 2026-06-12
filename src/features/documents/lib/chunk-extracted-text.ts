export type ExtractedTextChunk = {
  chunkIndex: number
  title: string | null
  topic: string | null
  content: string
  characterCount: number
}

const MIN_CHUNK_CHARS = 800
const MAX_CHUNK_CHARS = 3500

type Section = {
  title: string | null
  lines: string[]
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split("\n")
  const sections: Section[] = []
  let current: Section = { title: null, lines: [] }

  for (const line of lines) {
    const headingMatch = /^(#{1,6}\s+.+)$/.exec(line.trim())
    const uppercaseHeading =
      /^[A-Z0-9][A-Z0-9\s&:/-]{2,}$/.test(line.trim()) && line.trim().length <= 80

    if (headingMatch || uppercaseHeading) {
      if (current.lines.length > 0 || current.title) {
        sections.push(current)
      }

      current = {
        title: headingMatch ? headingMatch[1].replace(/^#+\s*/, "").trim() : line.trim(),
        lines: [],
      }
      continue
    }

    current.lines.push(line)
  }

  if (current.lines.length > 0 || current.title) {
    sections.push(current)
  }

  if (sections.length === 0) {
    return [{ title: null, lines }]
  }

  return sections
}

function sectionBody(section: Section): string {
  const body = section.lines.join("\n").trim()
  if (!section.title) {
    return body
  }

  if (!body) {
    return section.title
  }

  return `${section.title}\n\n${body}`
}

function splitOversizedContent(content: string): string[] {
  if (content.length <= MAX_CHUNK_CHARS) {
    return [content]
  }

  const paragraphs = content.split(/\n\n+/).filter((paragraph) => paragraph.trim().length > 0)
  const chunks: string[] = []
  let current = ""

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph

    if (next.length > MAX_CHUNK_CHARS && current) {
      chunks.push(current.trim())
      current = paragraph
      continue
    }

    if (paragraph.length > MAX_CHUNK_CHARS) {
      if (current) {
        chunks.push(current.trim())
        current = ""
      }

      for (let index = 0; index < paragraph.length; index += MAX_CHUNK_CHARS) {
        chunks.push(paragraph.slice(index, index + MAX_CHUNK_CHARS).trim())
      }
      continue
    }

    current = next
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks.filter((chunk) => chunk.length > 0)
}

export function chunkExtractedText(text: string): ExtractedTextChunk[] {
  const sections = splitIntoSections(text)
  const rawChunks: Array<{ title: string | null; content: string }> = []

  for (const section of sections) {
    const body = sectionBody(section)
    if (!body) {
      continue
    }

    if (body.length <= MAX_CHUNK_CHARS) {
      rawChunks.push({ title: section.title, content: body })
      continue
    }

    for (const part of splitOversizedContent(body)) {
      rawChunks.push({ title: section.title, content: part })
    }
  }

  const merged: Array<{ title: string | null; content: string }> = []

  for (const chunk of rawChunks) {
    const previous = merged.at(-1)

    if (
      previous &&
      previous.content.length < MIN_CHUNK_CHARS &&
      previous.content.length + chunk.content.length + 2 <= MAX_CHUNK_CHARS
    ) {
      previous.content = `${previous.content}\n\n${chunk.content}`
      previous.title = previous.title ?? chunk.title
      continue
    }

    merged.push({ ...chunk })
  }

  return merged.map((chunk, index) => {
    const topic = chunk.title ?? `Section ${index + 1}`

    return {
      chunkIndex: index,
      title: chunk.title,
      topic,
      content: chunk.content,
      characterCount: chunk.content.length,
    }
  })
}
