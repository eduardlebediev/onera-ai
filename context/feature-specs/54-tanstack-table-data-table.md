# Feature: TanStack Table — Shared DataTable Component

## Goal

Add TanStack Table to the project and create a shared `DataTable` component so all table pages (documents, tests, employees, analytics) have consistent sorting, filtering, pagination, and column pinning.

## User story

As an admin viewing a table, I want to click column headers to sort, use search and filters, and see paginated results, so that I can quickly find what I need regardless of how much data exists.

## Scope

### In scope

1. Install `@tanstack/react-table` and `nuqs`
2. Create shared `DataTable` component in `src/shared/ui/data-table/`
3. Refactor `DocumentsTable` to use new `DataTable`
4. Refactor `TestsListPage` table to use new `DataTable`
5. New `EmployeesTable` (from Spec 52) uses new `DataTable` from the start
6. Column pinning support for employee table (name pinned left, actions pinned right)
7. Sorting by clicking column headers
8. Client-side pagination (server-side later)
9. URL query params sync via `nuqs` (page, sort, search)

### Out of scope

- Server-side pagination (migration to LIMIT/OFFSET later)
- Row reordering
- Column resizing
- Row grouping/subtotals

## Files

### New

- `src/shared/ui/data-table/data-table.tsx` — main DataTable wrapper
- `src/shared/ui/data-table/data-table-toolbar.tsx` — search + filters
- `src/shared/ui/data-table/data-table-pagination.tsx` — page controls
- `src/shared/ui/data-table/data-table-column-header.tsx` — sortable header button
- `src/shared/ui/data-table/use-data-table-state.ts` — URL params sync via nuqs

### Updated

- `src/features/documents/components/documents-table.tsx` — refactor to DataTable
- `src/features/tests/components/tests-list-page.tsx` — refactor to DataTable
- `src/features/employees/components/employees-table.tsx` — uses DataTable

## DataTable Props

```ts
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  total?: number
  loading?: boolean
  toolbar?: ReactNode
}
```

## Column definition pattern

```ts
const columns: ColumnDef<Employee>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    meta: { pin: "left", width: 280 },
    enableSorting: true,
  },
  {
    id: "actions",
    meta: { pin: "right", width: 64 },
    cell: ({ row }) => <ActionMenu employee={row.original} />,
  },
]
```

## Acceptance criteria

- WHEN admin opens documents table, THEN columns are sortable by clicking headers
- WHEN admin types in search, THEN table filters results client-side
- WHEN admin opens employee table with many columns, THEN name is pinned left, actions pinned right
- WHEN admin navigates to a different page, THEN table paginates results
- WHEN admin reloads page, THEN URL params preserve page and sort state
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing shadcn `Table` component
- TanStack Table logic only, no visual framework
- Existing table components keep working during refactor
- Add `@tanstack/react-table` and `nuqs` to dependencies
- Keep column definitions in each feature folder, not in shared
