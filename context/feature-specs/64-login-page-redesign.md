# Feature: Login Page Redesign

## Goal

Redesign the login page as a full-screen split layout matching the app shell: navbar panel left, sign-in form right. Keep existing Supabase login and demo-login gating.

## User story

As a user, I want a consistent, responsive login screen with language and theme controls, so signing in feels like the rest of Ontera AI.

## Scope

- 50/50 split on desktop; stacked layout on mobile
- Left: shared `Logo`; desktop carousel (localized, no motion library); mobile shows centered logo only
- Right: email/password form, password toggle, language + theme switchers, demo quick-fill when `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`
- Remove footer, forgot-password, and sign-up links
- Reuse design tokens; add `Button` `brand`/`xl` and fix `Logo` SVG id collisions
- Access denied page keeps centered card on `bg-background`

## Out of scope

- Forgot password / request access
- One-click `demoLoginAction`
- Auth, API, or database changes

## Acceptance criteria

- Desktop: carousel + form in split layout; mobile: logo strip + form below
- Demo helpers only when demo login env flag is enabled
- Login uses existing `loginAction`; EN/DE copy works
- Lint, typecheck, and build pass
