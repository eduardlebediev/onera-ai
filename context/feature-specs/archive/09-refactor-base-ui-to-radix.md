# Feature Spec: Refactor UI Primitives from Base UI to Radix

## Goal

Replace unnecessary `@base-ui/react` usage with Radix-based shadcn-compatible primitives and clean up current UI implementation.

This is a refactor task only. Do not add new product features.

## Requirements

### 1. Replace Base UI with Radix where needed

Search for all `@base-ui/react` imports.

Replace Base UI primitives with Radix/shadcn-compatible implementation.

Target direction:

- Button should not use `@base-ui/react/button`
- interactive primitives should use Radix where appropriate:
  - Dropdown Menu
  - Dialog
  - Popover
  - Select
  - Tooltip
  - Accordion

Keep vaul for Drawer if it is already used by shadcn Drawer.

Do not remove `@base-ui/react` from dependencies until no imports remain.

### 2. Preserve shadcn component patterns

Components should follow shadcn-style conventions:

- `class-variance-authority` for variants
- `cn()` for class merging
- `asChild` support where useful
- accessible focus states
- named exports
- clean prop types

### 3. Remove Base UI dependency if unused

After replacing imports:

- check if `@base-ui/react` is still used
- if not used, remove it from `package.json`
- update lockfile

### 4. Refactor DocumentsKpiSection

Remove index-based icon mapping.

Bad pattern:

```
icons[index]
```

Use explicit data instead:

```
{
  label: "Failed Documents",
  value: 2,
  icon: AlertTriangle,
  tone: "danger",
  status: "failed"
}
```

Each KPI item should own:

- label
- value
- icon
- tone / visual variant
- status if needed

### 5. Remove text-based UI logic

Do not calculate display logic from visible text.

Bad pattern:

```
const isFailed = item.label.includes("Failed")
```

Use explicit typed properties instead:

```
item.status === "failed"
```

or:

```
item.tone === "danger"
```

Text should be for display only. Logic should use typed properties.

### 6. Remove unnecessary useIsClient

Search for `useIsClient`.

If it is only used to force client-side rendering, remove it and use `"use client"` where needed.

Keep client-only guards only when there is a real browser-only reason:

- `window`
- `localStorage`
- current time mismatch
- random values
- browser-only libraries

### 7. Simplify table rendering

Replace copied table rows with `.map()` over mock data.

Preferred pattern:

```
{documents.map((document) => (
  <DocumentRow key={document.id} document={document} />
))}
```

If a table row is large, extract a small row component.

Do not hardcode repeated rows manually.

### 8. Replace Typography component with CSS classes

Remove the Typography React component and `typographyVariants`.

Use CSS utility classes directly:

```
<h1 className="typography-h1">Documents</h1>
<p className="typography-p text-muted-foreground">...</p>
<span className="typography-label">Status</span>
```

Update all current usages of Typography.

Each typography class should include:

- font-family
- font-size
- font-weight where needed
- line-height
- letter-spacing

Required classes:

- `typography-h1`
- `typography-h2`
- `typography-h3`
- `typography-p`
- `typography-small`
- `typography-label`

### 9. Review ChartContainer

Review whether `ChartContainer` is needed.

If it is only used for one simple chart and can be simplified safely, simplify it.

If simplifying would create risk or break Recharts behavior, keep it for now and add a short comment explaining that it follows the shadcn/Recharts chart wrapper pattern.

Do not spend too much time on charts in this task.

## Do Not Implement

- no new pages
- no new product features
- no Supabase
- no AI logic
- no database logic
- no visual redesign
- no new animation library
- no large chart rewrite

## Files Likely Involved

- `src/shared/ui/button.tsx`
- `src/shared/ui/typography.tsx`
- `src/shared/ui/chart.tsx`
- `src/features/documents/components/documents-kpi-section.tsx`
- `src/features/documents/lib/document-kpi-stats.ts`
- `src/shared/lib/useIsClient.ts` (if exists)
- `context/progress-tracker.md`

## Verification

- No `@base-ui/react` imports remain
- `@base-ui/react` dependency is removed if unused
- Button uses Radix Slot for `asChild`
- Existing UI still renders correctly
- KPI cards use explicit icon/status/tone data
- No UI logic depends on display text
- Tables are rendered from arrays using `.map()`
- Typography component is removed
- Typography CSS classes are used directly
- Unnecessary `useIsClient` usage is removed
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: continue Documents → Tests flow with Generate Test Setup screen.
