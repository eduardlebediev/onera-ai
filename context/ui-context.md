## Theme

Light theme with dark navbar. The application uses a light gray page background with slightly lighter gray cards. Cards have subtle borders (no heavy shadows). Black top navigation bar with white text.

## Colors

| Role              | CSS Variable         | Value     |
| ----------------- | -------------------- | --------- |
| Page background   | `--background`       | `#E8E9EB` |
| Surface / Card    | `--card`             | `#F0F1F3` |
| Primary text      | `--foreground`       | `#171717` |
| Muted text        | `--muted-foreground` | `#64748B` |
| Primary accent    | `--primary`          | `#eb5f24` |
| Accent background | _derived_            | `#FFF2EC` |
| Border            | `--border`           | `#E2E8F0` |
| Error             | `--destructive`      | `#EF4444` |
| Success           | _via badge_          | `#10B981` |
| Warning           | _via badge_          | `#F59E0B` |

## Typography

| Role        | Font                          | Variable      |
| ----------- | ----------------------------- | ------------- |
| UI text     | **Geist Sans** (Google Fonts) | `--font-sans` |
| Code / mono | _Not defined_                 | —             |

Responsive type tokens live in `src/app/globals.css`:

| Role      | CSS Variable        | Behavior                    |
| --------- | ------------------- | --------------------------- |
| Heading 1 | `--font-size-h1`    | Fluid mobile-to-desktop h1  |
| Heading 2 | `--font-size-h2`    | Fluid section heading scale |
| Heading 3 | `--font-size-h3`    | Compact card/section titles |
| Body      | `--font-size-body`  | Responsive body copy        |
| Small     | `--font-size-small` | Helper and metadata text    |
| Label     | `--font-size-label` | Uppercase section labels    |

Use typography utility classes directly in JSX: `typography-h1`, `typography-h2`, `typography-h3`, `typography-p`, `typography-small`, and `typography-label`.

## Border Radius

| Context           | Class              | Value           |
| ----------------- | ------------------ | --------------- |
| Inline / small UI | `rounded-md`       | 8px             |
| Cards / panels    | `rounded-xl`       | 12px            |
| Buttons / pills   | `rounded-full`     | 9999px          |
| Badges / pills    | `rounded-md`       | 8px             |
| Layout shell      | `rounded-t-[24px]` | 24px            |
| Base token        | `--radius`         | 0.625rem (10px) |

## Component Library

**shadcn/ui** (Next.js 15 + Tailwind v4)

Components live in `shared/ui/`. Use the CLI (`npx shadcn add`) to add new components rather than writing from scratch.

## Layout Patterns

Responsive spacing tokens (CSS variables) live in `src/app/globals.css`.

| Token              | Purpose                        |
| ------------------ | ------------------------------ |
| `--spacing-page-x` | Responsive page horizontal pad |
| `--spacing-page-y` | Responsive page vertical pad   |

Use one of two `.page-shell` utility classes for route-level page wrappers:

| Class                | Max-width | Use case                      |
| -------------------- | --------- | ----------------------------- |
| `.page-shell`        | 1920px    | Dashboard-like, full-width    |
| `.page-shell-narrow` | 1280px    | Content-focused, detail pages |

Both include responsive horizontal/vertical padding, center alignment, and full width.

## Icons

**Lucide React** v0.553.0 — stroke-based icons only.

## Component Patterns
