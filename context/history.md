# Implementation History

## Feature Spec 49: Breadcrumbs

Completed breadcrumb navigation for the specified admin and employee pages.

- Added the shadcn-style breadcrumb primitive in `src/shared/ui/breadcrumb.tsx` after the required CLI command failed with a registry authorization error.
- Added the shared `Breadcrumbs` wrapper with `items: Array<{ label: string; href?: string }>` in `src/shared/components/breadcrumbs.tsx`.
- Replaced ad hoc breadcrumb rows where present and added breadcrumbs to document detail, generate test, test detail, review, publish, assign, analytics, employee tests, take test, result, and progress pages.
- Preserved route-local data loading and page behavior; only breadcrumb/navigation UI was changed.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Full `npm run format:check` still reports pre-existing markdown formatting issues in `.docs/next-plan.md` and `context/feature-specs/49-breadcrumbs.md`; touched source files pass Prettier.
