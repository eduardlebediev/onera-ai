export function buildSourceLabel(input: {
  documentTitle: string
  topic?: string | null
  chunkTitle?: string | null
}): string {
  const topicLabel = input.topic?.trim() || input.chunkTitle?.trim() || "Source chunk"
  return `${input.documentTitle} → ${topicLabel}`
}
