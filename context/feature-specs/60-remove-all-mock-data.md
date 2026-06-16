# Feature: Remove All Mock Data

## Goal

Remove all runtime mock data usage across the project. Every page must read from Supabase or show a proper empty state. Mock files should only remain if they export types used elsewhere.

## User story

As a developer cloning this project, I want to run `supabase db reset` and see real data on every page without any mock fallback, so the app behaves like a real product from the first run.

## Acceptance criteria

- WHEN running the app with Supabase data, THEN no mock values appear on any page
- WHEN Supabase data is empty, THEN proper empty states appear (not mock data)
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass
