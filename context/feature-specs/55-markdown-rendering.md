# Feature: Markdown Rendering for Document Text

## Goal

Format and display `documents.extracted_text` as rendered Markdown so headings, lists, tables, and formatting are visually displayed instead of showing raw Markdown syntax.

## User story

As an admin viewing a document, I want to see the extracted text properly formatted with headings, lists, and structure, so that it looks like a real document — not raw Markdown source.

## Scope

### In scope

- Install `react-markdown` and `remark-gfm` (for tables, strikethrough, task lists)
- Wrap extracted text in document detail page with `<ReactMarkdown>`
- Apply Tailwind prose styles for readable typography

### Out of scope

- Markdown editing
- Custom Markdown components (tables, code blocks — handled by remark-gfm)
- Other pages (only document detail extracted-text tab)

## UX/UI requirements

- Extracted Text tab and sidebar preview use `<ReactMarkdown>` instead of plain `whitespace-pre-wrap`
- Headings render as proper heading sizes (`#` → h1, `##` → h2, etc.)
- Lists render as bullet/numbered lists
- Tables render with readable styling
- No visible Markdown syntax characters
- Same container width and padding as current implementation
- Fallback: if text has no Markdown formatting, render as plain text (react-markdown handles this automatically)

## Data/API requirements

- No data changes — only display change
- `documents.extracted_text` already contains Markdown (from Spec 31 extraction prompt)
- Install: `npm install react-markdown remark-gfm`

## Edge cases

- Very large extracted text → react-markdown handles it (same as plain text)
- No extracted text → empty state unchanged
- Invalid Markdown → react-markdown renders what it can, ignores broken syntax
- Script injection → react-markdown escapes HTML by default (safe)

## Acceptance criteria

- WHEN admin opens document detail, THEN extracted text shows formatted headings, lists, and bold text
- WHEN admin views extracted text tab, THEN no raw `#` or `*` characters are visible
- WHEN document has tables, THEN they render with readable styling
- WHEN document has plain text only, THEN it renders normally
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Use `react-markdown` + `remark-gfm`
- No custom plugins — keep minimal
- Apply `prose` or custom Tailwind classes for typography
- Import and render only in document detail component
- No changes to other parts of the app
