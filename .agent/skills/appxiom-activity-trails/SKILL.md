# Appxiom Activity Trails Skill

Guidance for adding deliberate custom activity trails to important application functions with `ax.logActivity` from `@appxiom/web`.

## Description

An activity trail is a small, structured record of an important operation occurring in the application. It provides context around the user's path and application behavior without treating every function call as telemetry.

This skill identifies high-value function boundaries, proposes a compact list of activity events, and requires explicit user approval before adding any instrumentation.

## When to Use

- Adding observability around important user actions or application operations
- Investigating a flow that needs contextual breadcrumbs between user interaction and a failure
- Instrumenting key data mutations, integrations, or long-running client-side operations
- Auditing a feature for missing custom activity context

## What Makes a Good Trail Candidate

Favor functions that represent a durable, meaningful transition:

- User-initiated actions: submit, save, publish, upload, export, or retry
- Key data operations: creation, update, deletion, synchronization, or import
- External service boundaries: payment, authentication, search, or API-backed actions
- Important client-side milestones: a report generated, an editor opened, or a workflow step completed

Do not instrument render functions, trivial getters/setters, tight loops, high-frequency event handlers, or utility functions with no user or business significance. Avoid logging secrets, access tokens, passwords, raw personal data, request bodies, or large payloads.

## Approval Is Required

Before editing application code, inspect the relevant feature and present the candidate trails to the user. For each suggestion, include:

| Field | Include |
| --- | --- |
| Event name | A stable, human-readable action such as `Todo created` |
| Function and location | The function or handler that would emit the activity |
| Timing | Whether it is recorded before an attempt or after successful completion |
| Properties | Only bounded, useful, non-sensitive context |
| Reason | Why this function is an important trail boundary |

- Do not add, move, or remove `ax.logActivity` calls until the user explicitly approves the proposed list.
- Treat edits to the proposal, including changed names, timing, locations, or properties, as requiring renewed approval.
- Instrument only the approved candidates. Do not add inferred extras while implementing.
- If no candidates are appropriate, say so and do not instrument the code.

## API Reference

```javascript
ax.logActivity(name, properties = {});
```

- `name` is a stable activity name used for grouping and analysis.
- `properties` is an optional object of relevant contextual data.
- Call `logActivity` through the existing initialized Appxiom client. Do not create a second SDK instance solely for a trail.

## Implementation Guidance

### Name Activities Consistently

Use concise past-tense or completed-action names that describe the outcome, not the implementation detail:

```javascript
ax.logActivity('Todo created', { hasDueDate: true });
ax.logActivity('Report exported', { format: 'csv', rowCount: 42 });
```

Do not include IDs, timestamps, or user-provided free-form text in the name. Put only appropriately scoped metadata in `properties`.

### Choose the Correct Timing

Record an activity after a success when the event represents an accomplished operation:

```javascript
async function saveTodo(todo) {
  const savedTodo = await todoApi.create(todo);
  ax.logActivity('Todo created', { hasDueDate: Boolean(savedTodo.dueDate) });
  return savedTodo;
}
```

Record before an operation only when the attempt itself is meaningful and the proposed plan explicitly says so:

```javascript
function openExportDialog() {
  ax.logActivity('Export started', { source: 'project-page' });
  setExportDialogOpen(true);
}
```

Do not log a successful-completion event in a `catch` block or before a fallible operation has completed.

### Keep Properties Useful and Safe

Prefer small, bounded values that explain the operation:

```javascript
ax.logActivity('Search completed', {
  resultCount: results.length,
  filterCount: activeFilters.length,
});
```

Never include credentials, authentication headers, session identifiers, full request or response payloads, payment details, or unnecessary personal data. Avoid unbounded arrays, objects, and raw error stacks.

### Preserve Existing Error Handling

Activity instrumentation must not alter the function's return value, error propagation, retries, loading state, or control flow. Place the call beside the already-established business outcome.

## Verification

After implementing an approved plan:

1. Confirm every `ax.logActivity` call is located in an approved function and uses the approved name and properties.
2. Run the narrowest available test, typecheck, or build for the modified feature.
3. Confirm that error and cancellation paths do not emit completion activities.
4. Summarize exactly which approved trails were added and which validation was run.

## Related Documentation

- [Appxiom Web SDK (`@appxiom/web`)](../../ax-js/README.md)
- [Appxiom Goal Tracking Skill](../appxiom-goal-tracking/SKILL.md)
