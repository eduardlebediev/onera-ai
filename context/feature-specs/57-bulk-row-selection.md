# Feature: Bulk Row Selection and Batch Actions

## Goal

Add checkbox selection to all tables (documents, tests, employees) so users can select multiple rows and perform batch actions like delete, archive, assign, or nudge.

## User story

As an admin viewing a table, I want to select multiple rows with checkboxes and perform the same action on all of them at once, so that I don't have to repeat the same action for each row individually.

## Scope

### In scope

1. Add checkbox column to all tables (documents, tests, employees)
2. "Select all" checkbox in header — selects/deselects all visible rows
3. Selection state: show count of selected rows, action toolbar appears
4. Shared `useSelection` hook for row selection state
5. Shared `DataTableBulkActions` component for the floating action bar
6. Actions: delete documents, archive tests, assign employees, nudge employees

### Out of scope

- Server-side selection persistence across pages
- Keyboard shortcuts
- Drag selection

## UX/UI requirements

- First column in every table is a checkbox
- Header checkbox selects/deselects all visible rows
- When ≥1 row selected: floating bar below table header with count and action buttons
- Floating bar: "3 selected" on left, action buttons on right
- Clicking row still opens drawer — checkbox click stops propagation

## Data/API requirements

- No new API routes — reuse existing bulk endpoints or call single-action API per item
- `useSelection` hook: `{ selectedIds: Set<string>, toggle, selectAll, clearSelection }`
- `DataTableBulkActions` props: `selectedCount`, `children` (action buttons)

## Per-table bulk actions

| Table     | Available actions                     |
| --------- | ------------------------------------- |
| Documents | Delete (failed/processing), Archive   |
| Tests     | Archive, Delete (draft/archived only) |
| Employees | Assign test, Nudge reminder           |

## Acceptance criteria

- WHEN admin checks a row, THEN checkbox is checked and selection count updates
- WHEN admin checks ≥1 rows, THEN floating action bar appears
- WHEN admin clicks "Select all", THEN all visible rows selected
- WHEN admin clicks bulk action, THEN action performed on all selected rows
- WHEN action completes, THEN selection cleared and table refreshes
- WHEN admin clicks row content (not checkbox), THEN drawer opens as before
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Checkbox click stops propagation — row click opens drawer
- Bulk actions that don't apply to selected rows are disabled
- Implement as shared hook + toolbar component in `src/shared/ui/`
- When TanStack Table (Spec 54) lands, migrate checkbox column to native implementation
