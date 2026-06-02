## Theme

Light theme with dark navbar. The application uses a light gray page background with slightly lighter gray cards. Cards have subtle borders (no heavy shadows). Black top navigation bar with white text.

## Colors

| Role | CSS Variable | Value |
|------|-------------|-------|
| Page background | `--background` | `#E8E9EB` |
| Surface / Card | `--card` | `#F0F1F3` |
| Primary text | `--foreground` | `#0F172A` |
| Muted text | `--muted-foreground` | `#64748B` |
| Primary accent | `--primary` | `#eb5f24` |
| Accent background | *derived* | `#FFF2EC` |
| Border | `--border` | `#E2E8F0` |
| Error | `--destructive` | `#EF4444` |
| Success | *via badge* | `#10B981` |
| Warning | *via badge* | `#F59E0B` |

**Navbar:** `#050505` (near-black) with white text. Active nav link has orange underline indicator (`bg-[#eb5f24]`, 3px tall).

## Typography

| Role | Font | Variable |
|------|------|----------|
| UI text | **Geist Sans** (Google Fonts) | `--font-sans` |
| Code / mono | *Not defined* | — |


## Border Radius

| Context | Class | Value |
|---------|-------|-------|
| Inline / small UI | `rounded-md` | 8px |
| Cards / panels | `rounded-xl` | 12px |
| Buttons / pills | `rounded-full` | 9999px |
| Badges / pills | `rounded-md` | 8px |
| Layout shell | `rounded-t-[24px]` | 24px |
| Base token | `--radius` | 0.625rem (10px) |

## Component Library

**shadcn/ui** (Next.js 15 + Tailwind v4)

Components live in `shared/ui/`. Use the CLI (`npx shadcn add`) to add new components rather than writing from scratch.

## Layout Patterns


## Icons

**Lucide React** v0.553.0 — stroke-based icons only.

## Component Patterns
