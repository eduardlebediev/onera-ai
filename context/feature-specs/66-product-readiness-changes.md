# Feature: Product Readiness Before Deployment

## Goal

Prepare Ontera AI for demo/production-like deployment by adding final product polish: favicon, app icons, local fonts, metadata, environment documentation, and basic deployment checks. The goal is not full SEO optimization, but a clean and professional product impression.

## User story

As a project owner, I want Ontera AI to look complete when deployed, so that reviewers see a polished product instead of a default Next.js/demo setup.

## Scope

### In scope

- Replace default favicon with Ontera AI favicon
- Add app icons for browser/bookmarks
- Add local font files and configure them via `next/font/local`
- Fill basic Next.js metadata:
  - app title
  - description
  - application name
  - creator/project name
  - basic Open Graph title/description/image
- Add default preview image for shared links if simple to include
- Update browser tab title
- Verify Vercel build readiness
- Remove obvious placeholder/default Next.js branding

### Out of scope

- Advanced SEO
- `robots.txt`
- `sitemap.xml`
- Keyword optimization
- Structured data/schema.org
- Analytics
- Custom domain setup
- Full marketing preview strategy
- Performance audit

## UX/UI requirements

- Browser tab should show `Ontera AI`
- Favicon should match product branding
- Fonts should load locally and consistently
- App should not show default Next.js assets
- Shared link preview should look acceptable, not empty or generic
- Visual changes should not affect existing layout or components

## Data/API requirements

- Update `src/app/layout.tsx` metadata
- Add assets to `public/`:
  - `favicon.ico`
  - `icon.svg` or `icon.png`
  - `apple-icon.png`
  - optional `og-image.png`
- Add local fonts to:
  - `src/app/fonts/`
  - or `public/fonts/`
- Configure fonts with `next/font/local`
- Apply font variables in root layout or `globals.css`

## Edge cases

- WHEN favicon is missing, THEN browser should not fall back to default Next.js icon
- WHEN preview image is not available, THEN metadata should still work without breaking build
- WHEN fonts fail to load, THEN fallback font should keep UI readable
- WHEN deployed on Vercel preview URL, THEN app should still render correctly

## Acceptance criteria

- WHEN app opens in browser, THEN tab title shows `Ontera AI`
- WHEN app is bookmarked, THEN Ontera AI favicon appears
- WHEN app loads, THEN local fonts are used
- WHEN inspecting metadata, THEN no default Next.js placeholder title/description remains
- WHEN checking `public/`, THEN favicon and app icon assets exist
- WHEN running production build, THEN build succeeds
- WHEN deployed to Vercel preview, THEN app opens without missing asset errors

## Constraints

- Reuse existing app structure
- Do not change routes
- Do not change auth flow
- Do not redesign UI
- Do not add SEO libraries
- Keep implementation minimal
- Focus on product polish, not search ranking
- Run checks before final answer
