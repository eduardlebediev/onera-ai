# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- In Progress

## Current Goal

- Feature Spec 02: App shell layout (top nav, role switcher, page shell)

## Completed

- **Feature Spec 01: Set up shadcn/ui Design System**
  - Initialized shadcn/ui v4.10.0 (base-nova style, CSS variables, RSC, TSX)
  - Added core components: `button`, `card`, `badge`, `input`, `separator`, `dropdown-menu`, `drawer` — all in `src/components/ui/`
  - Configured `src/app/globals.css` with Ontera AI color tokens (orange primary `hsl(18 84% 53%)`, light gray background `hsl(0 0% 96%)`, border `hsl(214 32% 91%)`, `--radius: 0.625rem`)
  - Fixed `@theme inline` to reference `--font-geist-sans` (Next.js Geist font variable) for both `--font-sans` and `--font-heading`
  - `src/lib/utils.ts` has `cn()` using `clsx` + `tailwind-merge`
  - `src/app/page.tsx` replaced with component gallery (buttons, badges, inputs, cards, color tokens)
  - `npm run lint` and `npm run build` pass cleanly

## In Progress

- None.

## Next Up



## Open Questions

- None at this stage.

## Architecture Decisions

- shadcn/ui components live in `src/components/ui/` (shadcn CLI default). Per Feature Spec 01 verification checklist. Future shared UI primitives beyond shadcn will live in `src/shared/ui/`.
- shadcn v4.10.0 uses the `base-nova` style (the renamed "New York" style in the new CLI). The underlying design tokens and component approach are equivalent.
- Tailwind v4 uses oklch colors natively. Ontera AI palette tokens use `hsl()` format in CSS custom properties, which is fully compatible with the Tailwind v4 `@theme inline` mapping.

## Session Notes

- Stack: Next.js 16.2.7 + React 19 + Tailwind v4 + shadcn v4.10.0 + TypeScript 5
- No Supabase, auth, or AI integration yet.
