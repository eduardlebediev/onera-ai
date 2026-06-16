# Feature: English and German Interface Localization

## Goal

Add a lightweight bilingual interface for Ontera AI so users can switch the app UI between English and German without changing the existing app structure, auth flow, Supabase logic, or routes.

## User story

As an admin or employee, I want to switch the interface language between English and German, so that I can use Ontera AI comfortably in my preferred language.

## Scope

### In scope

- Add supported locales: `en`, `de`
- Add language switcher in the top navbar
- Store selected language in cookie/localStorage
- Translate static UI labels, buttons, empty states, error states, navigation, login page
- Translate admin and employee UI
- AI-generated feedback should be generated/displayed in the selected UI language
- Format dates/numbers using selected locale where visible

### Out of scope

- Translating uploaded documents
- Translating user-entered content
- Translating database records automatically
- German/English localized URLs like `/de/admin/dashboard`
- Full CMS-style translation management

## UX/UI requirements

- Compact language switcher: `EN / DE` in `TopNavbar`, near user menu
- Switcher also visible on login page
- Current language visually active
- Switching updates UI immediately
- Default language: English
- German labels should be natural, not literal machine translation

## Data/API requirements

- Create `src/shared/i18n/` with:
  - `en.ts` — English dictionary
  - `de.ts` — German dictionary
  - `locale-config.ts` — supported locales, default locale
  - `language-context.tsx` — LanguageProvider + useLanguage hook
  - `use-translation.ts` — `t(key)` helper
- Persist locale in cookie (`NEXT_LOCALE`)
- Server components read locale from cookies
- Client components use i18n hook/provider
- AI generation prompts receive selected language

## Edge cases

- No language selected → fallback to English
- Translation key missing → fallback to English text
- User logs out/logs in → selected language stays saved
- AI feedback already exists in old language → do not auto-translate historical feedback
- German text longer → UI should not overflow buttons/cards/table headers

## Acceptance criteria

- WHEN user selects German, THEN navigation, login, dashboards, tables, buttons and empty states are shown in German
- WHEN user selects English, THEN the same UI is shown in English
- WHEN user refreshes the page, THEN selected language remains active
- WHEN admin generates AI feedback/test content, THEN generated feedback follows selected language
- WHEN a translation key is missing, THEN app does not crash
- WHEN running checks, THEN typecheck and lint pass

## Constraints

- Reuse existing components
- Do not break existing behavior
- Keep implementation minimal
- Do not change routes in this iteration
- Run checks before final answer
