# Feature Spec: Add Responsive Design Tokens and Typography

## Goal

Create the first responsive design system primitives for Ontera AI.

## Requirements

- Add responsive CSS variables for spacing and typography in `globals.css`
- Add simple typography utility classes or tokens
- Create reusable `Typography` component
- Support common variants:
  - `h1`
  - `h2`
  - `h3`
  - `p`
  - `muted`
  - `small`
  - `label`
- Use existing design tokens and shadcn setup
- Keep implementation simple and reusable
- Update the design preview page to show typography and spacing examples

## Design Direction

Use fluid/responsive values where useful:

- page padding should adapt to screen size
- headings should scale between mobile and desktop
- vertical spacing should be consistent
- text hierarchy should feel clean and SaaS-like

## Files Likely Involved

- `src/shared/ui/typography.tsx`
- `src/app/globals.css`
- `src/app/preview/page.tsx`
- `context/progress-tracker.md`

## Verification

- typography variants render correctly
- spacing adapts on mobile and desktop
- no hardcoded random font sizes across preview components
- `npm run lint` passes
- `npm run typecheck` passes
- `context/progress-tracker.md` is updated
