import "server-only"

export function formatOptionTexts(
  options: Array<{ id: string; text: string }>,
  optionIds: string[]
): string {
  const texts = optionIds
    .map((id) => options.find((option) => option.id === id)?.text)
    .filter((text): text is string => Boolean(text))

  return texts.length > 0 ? texts.join(", ") : "—"
}
