# Feature: Review Page Supabase Backing

## Goal

Make `/admin/tests/review` read from Supabase-backed data sources instead of falling back silently to `getMockTestReviewData()` when no sessionStorage draft exists.

## User story

As an admin, when I open the review page after generating an AI test draft, I want to see my actual generated questions, not mock data, even if I navigated away and sessionStorage was cleared.

## Scope

### In scope

- Review page reads `ai_generation_runs` from Supabase to find latest draft for document
- If sessionStorage has a draft → use it (existing behavior)
- If no sessionStorage draft → fetch latest `completed` generation run from Supabase
- If Supabase has a recent completed run → reconstruct review data from stored questions/chunks
- If nothing found → fallback to mock data with a visible "demo fallback" label
- Add banner when showing mock fallback on review page

### Out of scope

- Publishing flow changes
- SessionStorage removal (keep both sources for now)
- Test questions editor
- Multi-document review

## UX/UI requirements

- Review page shows real AI-generated questions when available
- When showing mock fallback, display orange banner: "Showing demo data. Generate a test to see real AI-generated questions."
- No layout or component changes

## Data/API requirements

- Fetch `ai_generation_runs` by `document_id`, ordered by `created_at DESC`, limit 1
- If found and `status = completed`, reconstruct review data from `test_questions` or generation output
- New helper: `getLatestGenerationRunForDocument(documentId)`

## Edge cases

- No generation run exists → mock fallback with banner
- Generation run exists but has no questions → mock fallback
- sessionStorage has draft → use it (skip Supabase)
- Generation run failed → skip, mock fallback

## Acceptance criteria

- WHEN admin opens review page with a recent AI generation, THEN real generated questions appear
- WHEN admin opens review page without any generation, THEN mock data appears with "demo fallback" banner
- WHEN sessionStorage has a draft, THEN it takes priority over Supabase
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Keep existing `getMockTestReviewData()` as fallback
- Keep existing sessionStorage handoff (spec 24)
- Do not change publish route
- Do not change test detail route
- Minimal new code
