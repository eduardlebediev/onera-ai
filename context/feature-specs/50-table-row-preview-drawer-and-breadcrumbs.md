# Feature: Table Row Preview Drawer + Breadcrumbs on Full Pages

## Goal

Clicking a table row opens a bottom drawer with a quick preview. Drawer chrome has minimalist icon-only "Open full page" and "Close" actions beside the drag handle. Breadcrumbs appear only on full pages, never in drawers.

## User story

As a user browsing a table, I want to click a row and see a preview in a bottom drawer without leaving the list, so I can quickly check details. When I open the full page, I want breadcrumbs showing where I am.

## Scope

### In scope

1. Documents table — click row opens bottom drawer (existing `DocumentDrawer`, add shared drawer action slots)
2. Tests table — click row opens bottom drawer (same pattern, new `TestDrawer` component)
3. Icon-only "Open full page" + "Close" actions in shared drawer chrome
4. Breadcrumbs on full detail pages only (not in drawers)
5. Full pages: Document detail, Generate test, Test detail, Review, Publish, Assign, Analytics, Employee take/result

### Out of scope

- Employee pages drawer (no table drawers for employee)
- Side drawer (use existing bottom drawer from Vaul)
- Inline editing in drawer

## UX/UI requirements

- Same `Drawer` component (`direction="bottom"`, `h-[90vh]`) as existing `DocumentDrawer`
- Drawer chrome: "Open full page" icon action on the left and "Close" icon action on the right, both beside the drag handle
- Drawer previews do not show a separate document/test preview title header
- Clicking a table row → drawer opens with that row's data
- Click outside or "Close" → drawer closes
- "Open full page" → navigates to `/admin/documents/[id]` or `/admin/tests/[id]`
- Breadcrumbs only on full pages, never in drawer

## Breadcrumb behavior

| Context        | Breadcrumbs |
| -------------- | ----------- |
| Table list     | No          |
| Drawer preview | No          |
| Full page view | Yes         |

## Files

- Update `src/shared/ui/drawer.tsx` — add left/right action slots for bottom drawer chrome
- Update `src/features/documents/components/document-drawer.tsx` — use shared action slots for Open full page and Close icon buttons
- New `src/features/tests/components/test-drawer.tsx` — same pattern for tests table
- Update `src/features/tests/components/tests-list-page.tsx` — wire drawer open on row click
- Add shadcn breadcrumb component via `npx shadcn@latest add breadcrumb`
- Create shared Breadcrumbs component for full pages

## Acceptance criteria

- WHEN admin clicks a document row, THEN bottom drawer opens with preview + "Open full page" / "Close" buttons
- WHEN admin clicks a test row, THEN bottom drawer opens with preview + buttons
- WHEN admin clicks "Open full page", THEN navigates to full page with breadcrumbs
- WHEN admin clicks "Close" or outside, THEN drawer closes
- WHEN drawer is open, THEN no breadcrumbs are visible
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `Drawer` component (Vaul via shadcn)
- Drawer content is the existing detail component or a simplified preview
- Breadcrumbs only on full pages, never in drawers
- Do not duplicate full page logic inside drawer
