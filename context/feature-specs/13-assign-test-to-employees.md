# Feature Spec: Assign Test to Employees

## Goal

Create a mock assignment flow where an admin assigns a published test to selected employees.

This step connects the admin test management flow with the employee experience, but uses mock data only.

## User Flow

Test Detail → Click "Assign to Employees" → Select employees → Configure deadline → Confirm assignment → Success state → Return to Test Detail or open Assignments summary

## Requirements

### 1. Add entry point from Test Detail

On `/tests/[id]`, add a primary action:

```
Assign to Employees
```

The action should navigate to:

```
/tests/[id]/assign
```

Only published tests should show this as a primary action.

For draft tests, show disabled state or helper text:

```
Publish this test before assigning it to employees.
```

### 2. Create Assign Test route

Create:

```
/tests/[id]/assign
```

The page should load the selected test from mock data.

If test id does not exist, show a simple not-found state.

### 3. Show test context

At the top of the page, show test summary:

- test title
- status
- difficulty
- target role
- question count
- passing score
- source document
- current assigned employees count

### 4. Add employee selection

Show mock employees in a selectable list or table.

Each employee should show:

- name
- email
- role / department
- current progress status
- completed tests count
- average score
- risk / progress indicator if available

Admin should be able to select and deselect employees.

### 5. Add simple filters

Add lightweight filters for employees:

- All
- Not assigned
- In progress
- Completed
- At risk

Filters should work with mock data only.

### 6. Add assignment settings

Add assignment configuration panel:

- deadline date
- optional note/instructions
- reminder placeholder toggle
- selected employees count

No real notification or reminder logic.

### 7. Add assignment summary panel

Show live summary:

- selected test
- selected employees count
- deadline
- already assigned employees count
- new assignments count

If no employees are selected, show warning or disable confirm action.

### 8. Confirm assignment

Primary action:

```
Assign Test
```

On click, update local/mock state and show success state:

```
Test assigned successfully
```

Success state should show:

- test title
- number of assigned employees
- deadline
- next actions

### 9. Add next actions

After success, show:

- Back to Test Detail
- View Employee Tests
- Assign More Employees

View Employee Tests can navigate to the next planned employee route:

```
/employee/tests
```

If route does not exist yet, create a placeholder page:

```
Employee My Tests will be implemented next.
```

## Mock Data

Create or extend mock data for:

- employees
- employee progress status
- existing assignments
- new assignment state
- assignment deadline

Keep mock data colocated with the relevant feature if that structure exists.

## Design Requirements

Use current Ontera AI design system:

- Card
- Badge
- Button
- Input
- checkbox or selectable row pattern
- typography CSS classes
- responsive spacing tokens
- existing admin layout

The page should feel like an admin assignment workflow, not a generic user list.

## Do Not Implement

- real database writes
- Supabase
- real auth
- real notifications
- real reminders
- email sending
- employee test-taking logic
- complex permission system
- team-based assignment

## Files Likely Involved

- `src/app/tests/[id]/assign/page.tsx`
- `src/features/tests/components/assign-employees-page.tsx`
- `src/features/tests/components/assign-employee-list.tsx`
- `src/features/tests/components/assign-settings-panel.tsx`
- `src/features/tests/components/assign-summary-panel.tsx`
- `src/features/tests/mock/employees.ts`
- `context/progress-tracker.md`

## Verification

- `/tests/[id]/assign` opens correctly
- invalid test id shows not-found state
- test context renders correctly
- employee list renders from mock data
- employees can be selected and deselected
- filters work with mock data
- deadline can be set
- assignment summary updates from local state
- confirm action is disabled or discouraged with zero selected employees
- assigning shows success state
- success actions navigate correctly
- no backend or real persistence added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: **Employee My Tests**.
