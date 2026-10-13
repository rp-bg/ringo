# Appxiom Test Issue Skill

Guidance for triggering a single SDK test issue to verify Appxiom reporting, then removing the test call once validation is complete.

## Description

This skill helps confirm that the Appxiom SDK is initialized correctly and that custom issues are being reported to the Appxiom dashboard. Use it during integration testing or debugging in JavaScript or TypeScript projects, not as a permanent feature.

## When to Use

- Validating that the SDK is wired correctly in a browser or client app
- Smoke-testing the custom issue pipeline after integration
- Confirming that `reportCustomIssue` is reaching the Appxiom backend
- Triggering a test issue from a TypeScript app using the SDK's declared client type
- Verifying a deployment before removing the temporary test trigger

## Required Pattern

Use the existing helper by calling `raiseTestIssue` when you need to trigger a test issue in the app.

```javascript
ax.raiseTestIssue();
```

This should be used only as a temporary validation hook and should never be left in production code.

### TypeScript

Keep the initialized client typed with the SDK's exported type; do not cast it to work around missing declarations.

For `@appxiom/web`:

```typescript
ax.raiseTestIssue();
```

For `@appxiom/4react`:

```typescript
ax.raiseTestIssue();
```

Place the call in a temporary validation path and remove it after confirming the issue is reported.

## Before You Add It

Confirm the app already has an initialized Appxiom instance (`ax`). Do not create a separate SDK instance just for test verification.

```javascript
const ax = await init(
  'YOUR_APP_KEY',
  'YOUR_PLATFORM_KEY',
  'YOUR_APP_VERSION',
  'YOUR_BUILD_IDENTIFIER',
);
```

## Add the Test Trigger

Place the call in a developer-only entry point, a temporary debug button, or a short-lived validation path that is easy to remove.

```javascript
// Temporary validation hook
ax.raiseTestIssue();
```

```typescript
ax.raiseTestIssue();
```

This helper generates a major custom issue with a payload and stack trace so the issue appears in Appxiom with useful context.

## Take It Out After Verification

After confirming monitoring and reporting work as expected, remove the call immediately.

- Delete the `ax.raiseTestIssue();` line.
- Remove any temporary button, route, or debug code added solely for the test.
- Remove any test-only comments or validation notes that are no longer needed.
- Do not leave `raiseTestIssue` in application code, even if it is behind a feature flag.

### Example removal

```javascript
// Removed after validation
// ax.raiseTestIssue();
```

```typescript
// Removed after validation
// ax.raiseTestIssue();
```

This is the expected cleanup step: take out the raising of the test issue once the integration is confirmed.

## Verification

After adding the test trigger:

1. Run the app in the browser or client environment.
2. Trigger the temporary validation path.
3. Confirm the issue appears in the Appxiom dashboard.
4. Remove the trigger and validate the app still starts cleanly.

## Related Documentation

- [Appxiom Web SDK (`@appxiom/web`)](../../ax-js/README.md)
- [Appxiom React SDK (`@appxiom/4react`)](../../ax-react/README.md)
- [Appxiom Core Integration Skill](../appxiom-web-core-integration/SKILL.md)
