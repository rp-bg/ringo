# Appxiom Goal Tracking Skill

Guidance for instrumenting critical workflows in a web application with Appxiom goals (`ax.startGoal` / `ax.endGoal`) using `@appxiom/web`.

## Description

A "goal" is a named, timed measurement of a critical user workflow (e.g. checkout, signup, onboarding). This skill describes how to identify critical workflows in a codebase, place `startGoal`/`endGoal` calls at the correct boundaries, and avoid common mistakes (unmatched starts, ending goals on failure paths, missing values).

## When to Use

- Adding conversion/funnel tracking to a checkout, signup, onboarding, or payment flow
- Instrumenting a multi-step wizard or form flow
- Measuring time-to-completion for an async operation (upload, search, report generation)
- Auditing an existing app for missing goal instrumentation
- Reviewing a PR that touches a critical workflow and should include goal tracking

## What Counts as a "Critical Workflow"

Look for flows where business value is created or lost, typically:
- Checkout / payment / purchase completion
- Signup / registration / onboarding
- Login / authentication
- Search-to-result or search-to-purchase
- Form submission for lead generation
- File upload / import / export
- Any multi-step wizard with a clear start and end state

If unsure which flows are "critical" in this codebase, grep for route handlers, form `onSubmit`, checkout/payment components, or ask the user which flows matter most before instrumenting broadly.

## Confirm Before Instrumenting

Before writing any `startGoal`/`endGoal` code, present the identified list of candidate workflows to the user: proposed goal name, entry point (where `startGoal` would go), and the successful terminal outcome (where `endGoal` would go).

- Do not add any goal-tracking code until the user confirms the list.
- If the user adjusts the list (adds, removes, renames, or changes boundaries), update the plan and only proceed with the confirmed set.
- If the user asks to instrument only a subset, or points out a workflow you missed, treat that as the source of truth over your own inference.

## API Reference

### `ax.startGoal(name)`

Starts a named goal timer. Call at the moment the user begins the critical workflow.

```javascript
ax.startGoal('checkout-flow');
```

### `ax.endGoal(name, properties = {}, value = null)`

Ends a named goal. Call only at the moment the workflow succeeds — not on failure or abandonment paths.

```javascript
ax.endGoal('checkout-flow', { cartValue: 120.0 }, 120.0);
```

- `name` must exactly match the `startGoal` name.
- `properties` is an object of arbitrary metadata relevant to the outcome (order id, plan, step reached, error reason).
- `value` is an optional numeric business value (revenue, item count) associated with the goal; pass `null` when there is no meaningful value (e.g. signup).

## Integration Steps

### Step 1: Identify the Workflow Boundary

Find where the workflow starts (e.g. user clicks "Begin Checkout", a wizard mounts, a form is opened) and where it successfully ends (success confirmation, order created).

### Step 2: Place `startGoal` at the Entry Point

Call `startGoal` once, as early as possible in the workflow, not on every step/render.

```javascript
function CheckoutPage() {
  useEffect(() => {
    ax.startGoal('checkout-flow');
  }, []);
  // ...
}
```

### Step 3: Place `endGoal` Only at the Successful Terminal Outcome

A goal must be ended **only** on the path where the workflow succeeds. Do not call `endGoal` on error or abandonment paths — an unfinished goal (never ended) is the correct signal for a failed or abandoned workflow.

```javascript
async function handlePlaceOrder(cart) {
  const order = await api.placeOrder(cart);
  ax.endGoal('checkout-flow', { orderId: order.id }, cart.total);
}
```

If `placeOrder` throws, let the error propagate/be handled normally — do not call `endGoal` in the `catch` block, and do not call it on cancel/navigate-away handlers either.

### Step 4: Use Stable, Descriptive Goal Names

- Use kebab-case names that describe the workflow, not the UI component: `checkout-flow`, `signup-flow`, `report-export`.
- Reuse the same name across the codebase for the same logical workflow — do not invent a new name per call site.
- Do not include dynamic data (user id, order id) in the goal `name`; put that in `properties` instead.

### Step 5: Attach Meaningful Properties and Value

- `properties`: include the outcome-relevant context (step reached, error reason, plan tier, item count).
- `value`: include only when there is a natural numeric business value (order total, subscription price). Use `null` otherwise — do not fabricate a value.

### Step 6: Verify No Duplicate or Unmatched Calls

- Ensure `startGoal(name)` is not called multiple times for the same in-progress workflow instance (e.g. on every re-render) — guard with `useEffect` deps, a ref, or an `onMount` hook.
- Ensure `endGoal(name)` is only reachable from the success path — audit for accidental calls in `catch` blocks, cleanup/unmount handlers, or cancel handlers.

## Common Mistakes

1. **Starting a goal on every render** instead of once at workflow entry — wrap in `useEffect(() => {...}, [])` or an equivalent one-time lifecycle hook.
2. **Ending the goal on error or abandonment paths** — `endGoal` must only be called on success; failed/abandoned workflows should simply never be ended.
3. **Ending a goal with the wrong name** — a typo or mismatched string means `endGoal` silently does nothing.
4. **Putting dynamic identifiers in the goal name** — breaks aggregation; put them in `properties`.
5. **Fabricating a `value`** when there is no real business value for the workflow — pass `null`.
6. **Instrumenting at the wrong granularity** — a goal should represent one full workflow, not each individual step. Use `ax.logActivity` for step-level tracking instead.

## Example: Multi-Step Wizard

```javascript
// Step 1: entry point of the wizard
function OnboardingWizard() {
  useEffect(() => {
    ax.startGoal('onboarding-flow');
  }, []);

  return <WizardSteps onComplete={handleComplete} onExit={handleExit} />;
}

// Step 2: success path only — endGoal is never called from handleExit/abandonment
function handleComplete(profile) {
  ax.endGoal('onboarding-flow', { stepsCompleted: profile.steps }, null);
}

// handleExit intentionally does not call endGoal; an abandoned wizard is
// simply a goal that was started but never ended.
function handleExit(currentStep) {
  // navigate away, no goal tracking call here
}
```

## Related Documentation

- [Appxiom Core SDK (@appxiom/web)](../../ax-js/README.md)
- [Appxiom Core Integration Skill](../appxiom-web-core-integration/SKILL.md)
