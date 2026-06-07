# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- In Progress

## Current Goal

## In Progress

- Feature Spec 07: Redesign Documents Page with Document Detail Page

## Next Up

## Open Questions

- None at this stage.

## Session Notes

- Stack: Next.js 16.2.7 + React 19 + Tailwind v4 + shadcn v4.10.0 + TypeScript 5
- No Supabase, auth, or AI integration yet.
- Document drawer scroll behavior was stabilized by constraining drawer height and moving scrolling to an inner overscroll-contained wrapper.
- Document detail header layout was adjusted so the status badge aligns with the top action controls and no longer crowds the title line.
- Grid spacing was standardized to match dashboard conventions: `gap-2` for card grids and `gap-6` retained for vertical section spacing.
- Document detail card stacks were tightened to `space-y-2` so card-to-card spacing is consistent even in non-grid grouped layouts.

## Architecture Decisions

- Document detail page now uses shadcn `Tabs` component for navigation between Overview, Extracted Text, Topics, Metadata, and Versions.

- shadcn/ui components live in a single location: `src/shared/ui/`. `components.json` aliases (`components` → `@/shared`, `ui` → `@/shared/ui`) ensure future `shadcn add` commands generate into the same place. The split `src/components/ui` layer was removed.
- shadcn v4.10.0 uses the `base-nova` style (the renamed "New York" style in the new CLI). The underlying design tokens and component approach are equivalent.
- Tailwind v4 uses oklch colors natively. Ontera AI palette tokens use `hsl()` format in CSS custom properties, which is fully compatible with the Tailwind v4 `@theme inline` mapping.
- Mock role context (`src/shared/lib/role-context.tsx`) uses React Context + `useState` to toggle between Admin and Employee roles client-side. No auth wiring yet.
- Semantic color tokens drive the shell instead of hardcoded hex. `--primary` was aligned to the brand orange (`oklch(0.659 0.189 40)` ≈ `#eb5f24`) to match `ui-context.md`. The dark navbar/shell uses `bg-foreground` with `text-background`, and the page surface uses `bg-background`. No brand-specific tokens (e.g. `navbar-black`) were introduced.

## Completed

- Feature Spec 06: Documents Mock Pages with Quick Preview
- Feature Spec 05: Responsive Design Tokens and Typography
- Feature Spec 04: Admin Dashboard with Mock Data
- Feature Spec 04 Refactor: Analytics Feature Components
- Feature Spec 04 Visual Alignment: Dashboard Reference
- Feature Spec 04 Enhancement: Active Employees KPI
- Feature Spec 04 Enhancement: Recharts Test Completions Chart
- Feature Spec 04 Refactor: Reusable KPI Card
- Feature Spec 03: Build Initial App Shell
- Feature Spec 02: Add Prettier, ESLint and Husky
- Feature Spec 01: Set up shadcn/ui Design System

See `context/history.md` for full details on each completed item.
