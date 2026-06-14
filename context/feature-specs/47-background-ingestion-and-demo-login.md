# Feature: Background Ingestion + Demo Login + Dead-UI Cleanup

## Goal

Move heavy document ingestion off the request path, add one-click demo login buttons, and remove residual "coming soon" controls so the app is ready for presentation.

## User story

As an admin uploading a document, I want the upload to return quickly and show processing status, so I don't have to wait for extraction. As a demo reviewer, I want to one-click sign in to see the product.

## Scope

### In scope

1. Split `uploadAndIngestDocument()` into fast store + background ingest
2. Documents page shows `processing` → `ready` status transitions without manual refresh
3. One-click "Demo admin" / "Demo employee" buttons on login page (gated by env flag)
4. Product description blurb on login page
5. Remove/implement residual "coming soon" controls:
   - Documents table Retry/Delete for failed docs
   - Document detail Edit Metadata, Share, View full text, Edit topics
   - Tests list "New Test"
   - Dashboard Export button
   - Delete unused `PlaceholderPage` component

### Out of scope

- Queue/Edge Function for production ingestion (fire-and-forget for MVP)
- Full virus scanning (adapter/hook point only)
- Complex progress UI

## UX/UI requirements

- Upload returns immediately with `processing` status
- Document list/detail show status transitions without manual refresh (polling or revalidation)
- Login page: two demo buttons + short product blurb when `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` is set
- "Coming soon" buttons either work (Retry = re-run ingestion) or are removed

## Data/API requirements

- Split `uploadAndIngestDocument()` into `storeUploadedDocument()` (fast) and `ingestDocument()` (background)
- Upload route returns after store + enqueue
- Demo login buttons call `loginAction` with seeded credentials
- Env: `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`

## Edge cases

- Ingestion fails → status = failed with processing_error
- User navigates away during processing → status eventually updates
- Demo mode off → regular login form only
- Document Retry on failed doc → re-run ingestion
- Large file → store returns fast, ingestion runs async

## Acceptance criteria

- WHEN admin uploads a document, THEN response returns quickly with `processing` status
- WHEN ingestion completes, THEN status transitions to `ready` without manual refresh
- WHEN demo mode is on, THEN login page shows demo buttons + product blurb
- WHEN admin clicks "Demo admin", THEN signed in as admin
- WHEN admin clicks "Demo employee", THEN signed in as employee
- WHEN no "coming soon" controls remain, THEN page has no dead buttons
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Fire-and-forget background task for MVP (no queue system)
- Demo login gated behind env var — production stays invite-only
- Remove "coming soon" controls, don't add new dead UI
- Delete `PlaceholderPage` component
