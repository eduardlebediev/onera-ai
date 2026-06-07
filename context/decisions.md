# Decisions

## 014 — Add MODULE manifests for major feature folders

Major existing feature folders should include lightweight `MODULE.md` manifests that define ownership, boundaries, route scope, and future integration constraints. This improves navigation and reduces cross-feature drift for AI-assisted implementation.

## 013 — Use Tests instead of Quizzes

We use "Tests" as the product term because it sounds more appropriate for an enterprise employee knowledge platform. "Quiz" can feel too informal or game-like.

## 012 — Build mock frontend flow before backend

We build the clickable mock flow first to validate the product experience before adding Supabase, pgvector, AI calls, and persistence.

## 011 — Keep AI output behind admin review

AI-generated test questions must stay in draft/review state until an admin approves and publishes them.

## 010 — Tests-first terminology in context docs

All active context docs use "Tests" terminology (test_documents, test_assignments, test_attempts, test generation, test review) to reduce ambiguity for AI agents.

## 009 — Document detail uses shadcn Tabs for navigation

The document detail page uses shadcn `Tabs` component for tabbed navigation between Overview, Extracted Text, Topics, Metadata, and Versions.

## 008 — shadcn/ui components live in src/shared/ui

All shadcn/ui generated components are placed in `src/shared/ui/`. `components.json` aliases (`components` → `@/shared`, `ui` → `@/shared/ui`) ensure future `shadcn add` commands generate into the same directory.

## 007 — shadcn v4 base-nova style

shadcn v4.10.0 uses the `base-nova` style (the renamed "New York" style). Underlying design tokens and component approach are equivalent to previous versions.

## 006 — Tailwind v4 oklch with hsl compatibility

Tailwind v4 uses oklch colors natively. Ontera AI palette tokens use `hsl()` format in CSS custom properties, which is fully compatible with the `@theme inline` mapping.

## 005 — Mock role context without auth wiring

`src/shared/lib/role-context.tsx` uses React Context + `useState` to toggle between Admin and Employee roles client-side. No auth integration yet.

## 004 — Semantic color tokens replace hardcoded hex

Shell colors use `bg-foreground`, `text-background`, `bg-background` tokens. `--primary` is aligned to brand orange (`oklch(0.659 0.189 40)` ≈ `#eb5f24`). No brand-specific tokens (e.g. `navbar-black`) were introduced.

## 003 — Drawer scroll via inner wrapper

Document drawer scroll behaviour is stabilised by constraining drawer height and moving scrolling to an inner `overscroll-contain` wrapper, preventing page background scroll interference.

## 002 — Status badge aligned with actions

Document detail header layout places the status badge aligned with top action controls, not crowding the title line.

## 001 — Grid spacing convention

Card grids use `gap-2` (matching dashboard). Vertical section spacing uses `gap-6`. Document detail card stacks use `space-y-2`.
