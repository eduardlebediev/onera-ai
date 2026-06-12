export function cleanExtractedText(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  cleaned = cleaned
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+$/g, "")
        .replace(/^[ \t]+/g, (match) => (match.length > 4 ? "    " : match))
    )
    .join("\n")

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")

  return cleaned.trim()
}
