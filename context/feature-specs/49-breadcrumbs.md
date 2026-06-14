# Feature: Breadcrumbs

## Goal

Add breadcrumb navigation to all pages so users always know where they are and can quickly navigate back up the hierarchy.

## User story

As a user, when I'm deep in a flow (like reviewing a generated test), I want to see the path I took and click any step to go back, so I don't have to use the browser back button.

## Scope

### In scope

1. Add shadcn breadcrumb component via CLI
2. Breadcrumbs on admin pages: Document detail, Generate test, Test detail, Review, Publish, Assign, Analytics
3. Breadcrumbs on employee pages: Tests, Take test, Result, Progress
4. Each breadcrumb part is a clickable link (except current page)

### Out of scope

- Dynamic dropdown menus in breadcrumbs
- Icons per breadcrumb level

## UX/UI requirements

- Use shadcn `Breadcrumb` component (`npx shadcn@latest add breadcrumb`)
- Same styling as existing page headers (muted-foreground links, regular text for current)
- Current page is plain text (not link), previous steps are links
- Horizontal bar at the top of the page, below the page title header
- Apply to both admin and employee pages

## Breadcrumb paths

### Admin

| Page                                  | Breadcrumb                                          |
| ------------------------------------- | --------------------------------------------------- |
| `/admin/documents/[id]`               | Documents / Security Guidelines                     |
| `/admin/documents/[id]/generate-test` | Documents / Security Guidelines / Generate Test     |
| `/admin/tests/[id]`                   | Tests / Security Guidelines Knowledge Test          |
| `/admin/tests/[id]/assign`            | Tests / Security Guidelines Knowledge Test / Assign |
| `/admin/tests/review`                 | Tests / Review                                      |
| `/admin/tests/publish`                | Tests / Review / Publish                            |
| `/admin/analytics`                    | Dashboard / Analytics                               |

### Employee

| Page                          | Breadcrumb                                             |
| ----------------------------- | ------------------------------------------------------ |
| `/employee/tests`             | My Tests                                               |
| `/employee/tests/[id]/take`   | My Tests / Security Guidelines Knowledge Test          |
| `/employee/tests/[id]/result` | My Tests / Security Guidelines Knowledge Test / Result |
| `/employee/progress`          | Dashboard / Progress                                   |

## Acceptance criteria

- WHEN admin opens document detail, THEN breadcrumb shows "Documents / Security Guidelines"
- WHEN admin clicks "Documents" in breadcrumb, THEN navigates to /admin/documents
- WHEN employee opens take page, THEN breadcrumb shows "My Tests / Test Title"
- WHEN user clicks any link in breadcrumb, THEN navigates to that page
- WHEN page is current, THEN text is not clickable
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Add shadcn breadcrumb via CLI: `npx shadcn@latest add breadcrumb`
- Use shared `Breadcrumbs` wrapper component
- Props: `items: Array<{ label: string; href?: string }>`
- Reuse existing typography classes
- Do not redesign page layout — breadcrumb sits between nav and page content
