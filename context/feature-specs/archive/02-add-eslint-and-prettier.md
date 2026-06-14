# Feature Spec: Add Prettier, ESLint and Husky

## Goal

Set up basic code quality tooling for Ontera AI.

## Requirements

- Add Prettier configuration
- Add `.prettierignore`
- Keep the existing Next.js ESLint setup
- Add `eslint-config-prettier` to avoid conflicts with Prettier
- Add Husky
- Add lint-staged
- Add scripts:
  - `lint`
  - `format`
  - `format:check`
  - `typecheck`

- Configure pre-commit hook to run lint-staged
- Do not change app features or UI

## Prettier Rules

Use:

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

## lint-staged

Use:

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

## Verification

- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- pre-commit hook works
- `context/progress-tracker.md` is updated
