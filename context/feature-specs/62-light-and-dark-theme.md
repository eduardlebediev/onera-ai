# Feature: Light and Dark Theme

## Goal

Add a reliable light/dark theme switcher to Ontera AI using Next.js App Router best practices. The app already has `:root` and `.dark` CSS variables, so implementation should reuse existing design tokens and only add theme state management, persistence, and UI controls.

## User story

As an admin or employee, I want to switch between light and dark theme, so that I can use the application comfortably in different lighting conditions.

## Scope

### In scope

- Add light/dark theme support
- Use existing CSS variables in globals.css
- Add theme provider in root layout
- Add theme options inside the existing user dropdown menu in top navbar
- Add theme toggle on login page (no dropdown available)
- Persist selected theme between sessions
- Avoid hydration mismatch and theme flashing
- Support light, dark, and system

### Out of scope

- Custom theme builder
- Per-organization branding themes
- User profile theme settings in database
- Changing existing color system from scratch
- Redesigning components

## UX/UI requirements

- Theme control inside the user dropdown menu in the top navbar
- User opens dropdown by clicking avatar/user button
- Dropdown includes a section: Light, Dark, System
- Current theme marked with check icon
- Use lucide-react icons: Sun (light), Moon (dark), Monitor (system), Check (active)
- No separate theme toggle button in the top navbar
- Login page may have a minimal theme toggle (no user dropdown)
- Theme switching happens immediately without page reload
- Theme applies to cards, popovers, dropdowns, charts, inputs, buttons, and backgrounds
- No theme flash on first load

## Data/API requirements

- Install `next-themes`
- Add `ThemeProvider` as a client component
- Wrap app in `src/app/layout.tsx`
- Add `suppressHydrationWarning` to `<html>`
- Use class-based theme switching (Tailwind/shadcn already uses `.dark`)
- Persist theme in localStorage via next-themes
- Config: `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`

## Edge cases

- No theme selected → system or default theme
- User refreshes → selected theme persists
- User opens login page → saved theme applied
- Theme still loading on client → no wrong icon render
- System theme changes → app updates if system mode selected
- JavaScript loads slowly → minimize theme flash via inline script

## Acceptance criteria

- WHEN user clicks user/avatar button in top navbar, THEN dropdown opens with theme options
- WHEN user selects Dark, THEN app switches to dark mode
- WHEN user selects Light, THEN app switches to light mode
- WHEN current theme is active, THEN it is marked with a check icon in dropdown
- WHEN user refreshes the page, THEN selected theme persists
- WHEN app renders on server/client, THEN no hydration warning from theme switching
- WHEN viewing top navbar, THEN there is no separate theme toggle outside the user dropdown
- WHEN running checks, THEN lint and typecheck pass

## Constraints

- Reuse existing shadcn DropdownMenu in TopNavbar
- Use next-themes for state management and persistence
- Reuse existing CSS variables — do not change the color system
- Do not break existing behavior
- Keep implementation minimal
- Follow Next.js App Router / shadcn dark mode pattern
