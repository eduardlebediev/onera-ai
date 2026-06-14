# Feature Spec: Set up shadcn/ui Design System

## Goal

Install and initialize shadcn/ui to establish the foundational design system for Ontera AI. This unit should result in a configured UI library with core components and a landing page preview demonstrating the visual style.

## Design Decisions

The default theme is light mode with a SaaS-focused aesthetic. Dark mode is reserved as a placeholder for future implementation.

Colors:

- Background: #F5F5F7 (Light gray)
- Card: #FFFFFF (Pure white)
- Primary Accent: #EB5F24 (Ontera Orange)
- Foreground: #0F172A
- Muted: #64748B

Styling features subtle borders (#E2E8F0), soft shadows, and a corner radius of 0.625rem. Refer to the layout and token patterns in src/app/globals.css and ui-context.md for spacing and typography scales.

## Implementation Details

1. Initialize shadcn/ui using npx shadcn-ui@latest init with New York style, Slate base color, and CSS variables enabled.
2. Install the button, card, badge, input, separator, dropdown-menu, and drawer components via CLI.
3. Update src/app/globals.css with the Ontera AI color tokens.
4. Ensure src/lib/utils.ts contains the cn() helper function.
5. Replace the content of src/app/page.tsx with a simple gallery showcasing the installed components.
6. Do not implement dashboard layouts, authentication, Supabase integration, or AI logic.

## Dependencies

- lucide-react for icons

## Verification Checklist

- shadcn/ui is successfully initialized and components.json is created.
- UI components are generated in src/components/ui/.
- globals.css reflects the Ontera AI color tokens.
- The cn() utility works correctly for conditional styling.
- npm run lint and npm run build pass without errors.
- The home page renders the component preview correctly.
- context/progress-tracker.md is updated to reflect completion.
