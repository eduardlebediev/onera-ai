# Feature: Toast Notifications

## Goal

Show toast notifications after important actions so users know the result without checking the next page.

## User story

As an admin, when I upload a document, assign a test, or archive a document, I want to see a brief notification confirming the action succeeded or showing an error, so I don't have to guess.

## Scope

### In scope

1. Add shadcn `sonner` toast component via CLI
2. Toast after document upload: "Document uploaded. Processing started."
3. Toast after assign: "X employees assigned successfully"
4. Toast after archive: "Document archived. X tests affected."
5. Toast after permanent delete: "Document permanently deleted."
6. Toast after test published: "Test published successfully."
7. Toast after actions with errors: "Failed to assign. Please try again."
8. Place toast trigger in the client component after the server action completes

### Out of scope

- Design system for toasts (use shadcn/sonner defaults)
- Custom toast positions or animations
- Toast queues (sonner handles this)
- Employee-facing toasts

## UX/UI requirements

- Toast appears in top-right corner (sonner default)
- Auto-dismisses after 4 seconds
- Success toasts: green/dark theme
- Error toasts: red/destructive theme
- One action per toast — do not stack multiple toasts
- Do not block user navigation (toast appears and disappears independently)

## Implementation

1. Add sonner: `npx shadcn@latest add sonner`
2. Add `<Toaster />` to root layout
3. In each client component that performs an action, call `toast.success()` or `toast.error()` after the action completes

## Specific toasts

| Action           | Success toast                                | Error toast                                |
| ---------------- | -------------------------------------------- | ------------------------------------------ |
| Upload document  | "Document uploaded. Processing started."     | "Upload failed. {error}"                   |
| Assign employees | "{count} employees assigned"                 | "Assignment failed. Try again."            |
| Archive document | "Document archived. {count} tests affected." | "Archive failed. Try again."               |
| Permanent delete | "Document permanently deleted."              | "Delete failed. Try again."                |
| Publish test     | "Test published successfully."               | "Publish failed. {error}"                  |
| Save test draft  | "Draft saved."                               | "Draft save failed."                       |
| Delete test      | "Test deleted."                              | "Delete failed. Test has active attempts." |

## Acceptance criteria

- WHEN admin uploads a document, THEN toast appears: "Document uploaded. Processing started."
- WHEN admin assigns 3 employees, THEN toast appears: "3 employees assigned successfully"
- WHEN admin archives a document, THEN toast appears confirming the action
- WHEN action fails, THEN error toast appears with a helpful message
- WHEN toast appears, THEN it auto-dismisses after 4 seconds
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Add sonner via shadcn CLI: `npx shadcn@latest add sonner`
- Reuse existing `toast` API from sonner (`toast.success()`, `toast.error()`)
- Do not add any other notification library
- Toasts do not replace error states on pages — they complement them
