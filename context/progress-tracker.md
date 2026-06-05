# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- In Progress

## Current Goal

- None.

## In Progress

- None.

## Next Up

## Open Questions

- None at this stage.

## Session Notes

- Stack: Next.js 16.2.7 + React 19 + Tailwind v4 + shadcn v4.10.0 + TypeScript 5
- No Supabase, auth, or AI integration yet.

## Architecture Decisions

- shadcn/ui components live in a single location: `src/shared/ui/`. `components.json` aliases (`components` → `@/shared`, `ui` → `@/shared/ui`) ensure future `shadcn add` commands generate into the same place. The split `src/components/ui` layer was removed.
- shadcn v4.10.0 uses the `base-nova` style (the renamed "New York" style in the new CLI). The underlying design tokens and component approach are equivalent.
- Tailwind v4 uses oklch colors natively. Ontera AI palette tokens use `hsl()` format in CSS custom properties, which is fully compatible with the Tailwind v4 `@theme inline` mapping.
- Mock role context (`src/shared/lib/role-context.tsx`) uses React Context + `useState` to toggle between Admin and Employee roles client-side. No auth wiring yet.
- Semantic color tokens drive the shell instead of hardcoded hex. `--primary` was aligned to the brand orange (`oklch(0.659 0.189 40)` ≈ `#eb5f24`) to match `ui-context.md`. The dark navbar/shell uses `bg-foreground` with `text-background`, and the page surface uses `bg-background`. No brand-specific tokens (e.g. `navbar-black`) were introduced.

## Completed

- **Feature Spec 05: Add Responsive Design Tokens and Typography**
  - Added responsive spacing and typography CSS variables in `src/app/globals.css`.
  - Created `src/shared/ui/typography.tsx` with reusable CVA-backed variants: `h1`, `h2`, `h3`, `p`, `muted`, `small`, and `label`.

- **Feature Spec 04: Admin Dashboard with Mock Data**
  - `src/data/mock/admin-dashboard.ts` — typed mock data for all dashboard sections (KPI stats, documents, tests, weak topics, recent activity)
  - `src/app/dashboard/page.tsx` — full admin dashboard Server Component replacing the placeholder; sections: header with Upload Document + Create Test actions, 5-card KPI grid, Recent Documents (with status badges + topic pills), Test Performance (with completion progress bar + score), Weak Topics (with correctness bar), Recent Activity (with type-mapped icons)
  - Uses existing shadcn/ui Card, Badge, Button; Lucide icons; design tokens only — no charts library, no backend logic
  - `npm run lint` and `npm run typecheck` pass cleanly

- **Feature Spec 04 Refactor: Analytics Feature Components**
  - `src/app/dashboard/page.tsx` is now a thin route component that imports mock dashboard data and renders `AdminDashboard`.
  - Dashboard UI was split into `src/features/analytics/components/` sections: admin dashboard container, header, KPI grid, recent documents, AI review, test performance, and test completions.
  - Shared dashboard formatting helpers live in `src/features/analytics/lib/dashboard-formatters.ts`; mock data remains in `src/data/mock/admin-dashboard.ts`.
  - Visible dashboard copy now consistently uses Tests where user-facing labels require the generic assessment term.
  - `npm run lint`, `npm run typecheck`, and `npm run build` pass.

- **Feature Spec 04 Visual Alignment: Dashboard Reference**
  - Dashboard spacing, grid gaps, KPI card sizing, header scale, and card/table typography were aligned closer to the provided dashboard reference while preserving the feature component structure.
  - App shell keeps the dark navbar fixed above an inner-scrolling page surface with the documented `rounded-t-[24px]` layout radius.
  - Dashboard primary CTA uses a black pill style like the reference; secondary CTA stays light/outline.
  - Mock KPI microcopy was adjusted for the score trend and weak-topic summary; mock data remains in `src/data/mock/admin-dashboard.ts`.
  - Dashboard cards now share one 12-column grid instead of separate row grids; KPI, table, review, and chart sections use column spans inside that single grid.
  - Base `Card` styling now centralizes the subtle border, card background, radius, and soft shadow used by the dashboard reference.
  - Global foreground/dark theme tokens were adjusted toward the black example palette (`#171717`, `#0a0a0a`, `#ededed`) and `ui-context.md` was updated.
  - Dashboard card vertical padding was tightened, and the completions chart was widened to occupy more of the 12-column grid.

- **Feature Spec 04 Enhancement: Active Employees KPI**
  - Added an `Active Employees` KPI to `src/data/mock/admin-dashboard.ts` for employees who completed at least one test in the last 7 days.
  - Updated `KpiGrid` to render six equal-width KPI cards on large screens with a matching Lucide user icon and existing card styling.
  - `npm run lint` and `npm run typecheck` pass.

- **Feature Spec 04 Enhancement: Recharts Test Completions Chart**
  - Added `weeklyCompletions` mock data in `src/data/mock/admin-dashboard.ts` and passed it through the dashboard route/container to `QuizCompletionsCard`.
  - Replaced the static inline SVG in `QuizCompletionsCard` with a shadcn-style `ChartContainer` using a Recharts `AreaChart`, token-based primary color, muted axis labels, and border grid lines.
  - Installed `recharts`; attempted `npx shadcn add chart`, but the remote `base-nova/chart.json` registry item returned unauthorized, so the standard chart wrapper was added in `src/shared/ui/chart.tsx`.
  - `npm run lint`, `npm run typecheck`, and `npm run build` pass.

- **Feature Spec 04 Refactor: Reusable KPI Card**
  - Extracted the dashboard KPI card into `src/shared/ui/kpi-card.tsx` using shadcn `Card`/`CardContent` and existing design-token classes.
  - Renamed the KPI feature component export from `KpiGrid` to `KpiSection`; `src/features/analytics/components/kpi-grid.tsx` now maps KPI mock stats to reusable `KpiCard` instances.
  - Updated `AdminDashboard` to import and render `KpiSection`.
  - `npm run lint` and `npm run typecheck` pass.

- **Feature Spec 01: Set up shadcn/ui Design System**
  - Initialized shadcn/ui v4.10.0 (base-nova style, CSS variables, RSC, TSX)
  - Added core components: `button`, `card`, `badge`, `input`, `separator`, `dropdown-menu`, `drawer` — all in `src/components/ui/`
  - Configured `src/app/globals.css` with Ontera AI color tokens (orange primary `hsl(18 84% 53%)`, light gray background `hsl(0 0% 96%)`, border `hsl(214 32% 91%)`, `--radius: 0.625rem`)
  - Fixed `@theme inline` to reference `--font-geist-sans` (Next.js Geist font variable) for both `--font-sans` and `--font-heading`
  - `src/lib/utils.ts` has `cn()` using `clsx` + `tailwind-merge`
  - `src/app/page.tsx` replaced with component gallery (buttons, badges, inputs, cards, color tokens)
  - `npm run lint` and `npm run build` pass cleanly

- **Feature Spec 02: Add Prettier, ESLint and Husky**
  - Added `prettier`, `eslint-config-prettier`, `husky`, `lint-staged` as devDependencies
  - `.prettierrc` configured with project rules (no semi, double quotes, 100 print width, es5 trailing comma)
  - `.prettierignore` added
  - `eslint.config.mjs` extended with `eslint-config-prettier` to disable conflicting rules
  - `package.json` scripts: `format`, `format:check`, `typecheck` added; `prepare` set to `husky`
  - `lint-staged` config added to `package.json`
  - Husky pre-commit hook runs `lint-staged`
  - Ran `prettier --write .` to format entire codebase to new rules
  - `npm run lint`, `npm run typecheck`, `npm run format:check` all pass

- **Feature Spec 03: Build Initial App Shell**
  - `src/shared/lib/role-context.tsx` — `RoleProvider` + `useRole` hook; mock role toggle (admin | employee) via React Context
  - `src/shared/ui/top-navbar.tsx` — dark near-black navbar with Ontera logo, role-appropriate nav links, orange active underline indicator, bell + search icons, role-switcher dropdown
  - `src/app/layout.tsx` — wraps app in `RoleProvider`, renders `TopNavbar` above all pages
  - `src/app/page.tsx` — redirects to `/dashboard`
  - Placeholder pages created: `/dashboard`, `/documents`, `/tests`, `/employees`, `/analytics` (admin); `/my-tests`, `/progress` (employee)
  - `src/shared/ui/placeholder-page.tsx` — shared placeholder layout component
  - `npm run lint` and `npm run typecheck` pass

- **App Shell Improvements (refinement of Spec 03)**
  - Mobile navbar: desktop links hidden below `md`; a compact shadcn `DropdownMenu` (hamburger `Menu` button) exposes the role-aware nav links on small screens. Role switch + bell/search stay accessible; responsive padding/gaps prevent horizontal overflow.
  - Fixed malformed role-switcher JSX (missing `DropdownMenuContent` wrapper).
  - shadcn paths consolidated to `src/shared/ui/` only; `components.json` aliases updated; empty `src/components/` removed. All UI imports already used `@/shared/ui/...`.
  - Hardcoded shell colors (`#050505`, `#E8E9EB`, `#eb5f24`) replaced with semantic tokens/classes (`foreground`, `background`, `primary`) in `layout.tsx` and `top-navbar.tsx`; `--primary` aligned to brand orange in `globals.css`.
  - `npm run lint` and `npm run typecheck` pass
