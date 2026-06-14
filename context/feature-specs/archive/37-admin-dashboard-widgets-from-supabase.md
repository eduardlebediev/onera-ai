# Feature: Admin Dashboard Widgets from Supabase

## Goal

Replace mock `aiDrafts` and `recentDocuments` widgets on `/admin/dashboard` with real Supabase-backed data.

## User story

As an admin, when I open the dashboard, I want to see real recent documents and real AI generation activity instead of static mock data, so that I can trust what I see during a demo.

## Scope

### In scope

- Fetch recent documents from Supabase `documents` table (latest 5, ordered by `created_at`)
- Fetch recent AI generation runs from `ai_generation_runs` (latest 5, status, model, document title)
- Update `supabase-admin-dashboard.ts` to return `recentDocuments` and `recentDrafts`
- Update dashboard page to use real data when Supabase returns results
- Keep mock fallback when Supabase is empty or errors

### Out of scope

- Full dashboard redesign
- Charts or analytics
- Employee dashboard widgets

## UX/UI requirements

- Recent documents list shows real uploaded documents (title, status, date)
- AI drafts list shows real generation runs (document title, status, date)
- Mock fallback banner if Supabase returns empty
- No layout changes

## Data/API requirements

- Recent documents: `SELECT id, title, status, created_at FROM documents ORDER BY created_at DESC LIMIT 5`
- AI drafts: `SELECT id, document_id, status, model, created_at FROM ai_generation_runs ORDER BY created_at DESC LIMIT 5` + join documents for title
- Both in `src/features/analytics/lib/supabase-admin-dashboard.ts`

## Edge cases

- Supabase has no documents → show mock fallback
- Supabase has documents but no AI runs → show real docs + mock fallback for drafts
- Dashboard fails to load → safe error, mock fallback
- Mix of seeded demo docs + uploaded docs → show newest first

## Acceptance criteria

- WHEN admin opens dashboard, THEN recent documents show real Supabase documents (not mock)
- WHEN admin opens dashboard, THEN AI drafts show real generation runs (not mock)
- WHEN Supabase is empty, THEN dashboard shows mock fallback with banner
- WHEN Supabase errors, THEN dashboard shows mock fallback
- WHEN mock data is shown, THEN orange fallback banner is visible
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `BackendFallbackBanner` component
- Do not change layout or add new UI components
- Keep existing mock data imports as fallback
- Do not modify employee dashboard
