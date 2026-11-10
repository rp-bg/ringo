---
name: appxiom-4react-integration
description: "Integrate @appxiom/4react in React applications, including React 18/19, Vite, and client-side setup for Next.js or other SSR frameworks. Use when adding Appxiom monitoring or telemetry to a React app."
---

# Appxiom 4React Integration Skill

Comprehensive guidance for integrating the Appxiom React SDK (`@appxiom/4react`) into React applications.

## Description

This skill provides step-by-step instructions, configuration patterns, and best practices for integrating Appxiom monitoring and telemetry into React applications using `@appxiom/4react`. It covers installation, initialization, automatic React hook instrumentation, bundler configuration, SSR frameworks (Next.js), and production deployment.

`@appxiom/4react` depends on `@appxiom/web` (installed automatically) and extends it with React-aware instrumentation. Use the `appxiom-web-core-integration` skill instead if the application is not React-based.

## When to Use

- **New React application setup**: Installing and initializing `@appxiom/4react` in a new app
- **Existing React application integration**: Adding the SDK to an established React codebase
- **Next.js / SSR integration**: Configuring client-only initialization for server-rendered React apps
- **Vite/bundler configuration**: Excluding the SDK from dependency optimization
- **TypeScript projects**: Type-safe SDK integration with `AXReact` types
- **Production deployment**: Configuring proper asset handling and MIME types for the WASM binary

## Integration Steps

### Step 1: Installation

```bash
npm install @appxiom/4react react
```

`@appxiom/web` is installed automatically as a dependency of `@appxiom/4react`. Requires React 18 or React 19.

### Step 2: Get API Keys

Obtain from Appxiom dashboard:
- `APP_KEY`: Application identifier
- `PLATFORM_KEY`: Platform identifier

### Step 3: Initialize SDK

Initialize once from browser-only application startup code, before rendering, and retain the returned `ax` instance for use elsewhere.

#### JavaScript

```javascript
import init from '@appxiom/4react';

const ax = await init(
  'YOUR_APP_KEY',
  'YOUR_PLATFORM_KEY',
  'YOUR_APP_VERSION',
  'YOUR_BUILD_IDENTIFIER',
);
```

#### TypeScript

```typescript
import init, { type AXReact } from '@appxiom/4react';

const ax: AXReact = await init(
  'YOUR_APP_KEY',
  'YOUR_PLATFORM_KEY',
  'YOUR_APP_VERSION',
  'YOUR_BUILD_IDENTIFIER',
);
```

`AXReact` extends the public `AX` API from `@appxiom/web`.

### Step 4: Initialize Before Rendering

Initialize in the browser entry point before `createRoot(...).render(...)` so automatic instrumentation is active when components begin rendering.

```javascript
// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import init from '@appxiom/4react';
import App from './App';

const setupApp = async () => {
  const ax = await init(
    'YOUR_APP_KEY',
    'YOUR_PLATFORM_KEY',
    'YOUR_APP_VERSION',
    'YOUR_BUILD_IDENTIFIER',
  );

  window.ax = ax; // or pass via context

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

setupApp();
```

Or expose the instance via React Context:

```typescript
// lib/ax-client.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import init, { type AXReact } from '@appxiom/4react';

const AXContext = createContext<AXReact | null | undefined>(undefined);

export const AXProvider = ({ children }: { children: ReactNode }) => {
  const [ax, setAx] = useState<AXReact | null>(null);

  useEffect(() => {
    let active = true;
    void init(
      'YOUR_APP_KEY',
      'YOUR_PLATFORM_KEY',
      'YOUR_APP_VERSION',
      'YOUR_BUILD_IDENTIFIER',
    ).then(
      (instance) => {
        if (active) setAx(instance);
      },
      (error: unknown) => {
        console.error('Failed to initialize Appxiom', error);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return <AXContext.Provider value={ax}>{children}</AXContext.Provider>;
};

export const useAX = () => {
  const ax = useContext(AXContext);
  if (ax === undefined) throw new Error('useAX must be used within AXProvider');
  return ax;
};
```

`useAX()` returns `null` until initialization completes; consumers should handle that loading state.

### Step 5: Automatic React Instrumentation

After initialization, `@appxiom/4react` automatically observes React hook activity (`useEffect`, `useLayoutEffect`, `useState`, `useReducer`, `useMemo`, `useCallback`) and tracks `useRef` instances for leak analysis. This is installed once per page — no component-level wrappers or hooks are required. React 18 and React 19 are both supported; the package resolves the correct internal dispatcher location automatically.

### Step 6: Vite Configuration

Exclude both packages from Vite dependency optimization so the WASM binary's source-relative URL is preserved:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@appxiom/4react', '@appxiom/web'],
  },
});
```

Clear the dependency cache after adding this configuration:

```bash
rm -rf node_modules/.vite
npm run dev -- --force
```

This setting only affects Vite's development optimizer; it is safe to keep for production builds.

### Step 7: SSR and Client-Only Frameworks

For React SSR frameworks such as Next.js and Remix, place the provider from Step 4 behind a client boundary and wrap the rendered app with it. For Nuxt and SvelteKit, use their framework-specific client-only plugins or components. Never initialize the SDK from server components, route handlers, or server-rendering code.

```typescript
// app/layout.tsx
import { AXProvider } from '@/lib/ax-client';
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AXProvider>{children}</AXProvider>
      </body>
    </html>
  );
}
```

### Step 8: Public API Usage

#### Set Custom User ID

```javascript
ax.setCustomId('user-12345');
```

#### Track Goals

```javascript
ax.startGoal('checkout');
ax.endGoal('checkout', { orderId: 'ORD-10023' }, 120.50);
```

See the `appxiom-goal-tracking` skill before instrumenting goals for critical workflows.

#### Log Activities

```javascript
ax.logActivity('Checkout Step Completed', {
  step: 'payment',
  orderId: 'ORD-10023',
});
```

#### Report Custom Issues

```typescript
import type { IssueSeverity } from '@appxiom/web';

const severity: IssueSeverity = 1; // 0=Minor, 1=Major, 2=Fatal

ax.reportCustomIssue(
  'Payment Failed',
  'Gateway connection timeout.',
  severity,
  { orderId: 'ORD-10023' },
  new Error('Timeout').stack,
);
```

### Step 9: Production Deployment

```bash
npm run build
```

The production build emits Appxiom's WebAssembly binary as an asset and rewrites its loader URL. Deploy the complete build output, including the generated `.wasm` file, without renaming or omitting assets.

Configure the web server to serve `.wasm` files with the correct MIME type:

```http
Content-Type: application/wasm
```

Ensure SPA fallback rules do NOT return `index.html` for `.wasm` requests.

**Nginx:**
```nginx
location ~* \.wasm$ {
  types { application/wasm wasm; }
  add_header Content-Type application/wasm;
}

location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache:**
```apache
<FilesMatch "\.wasm$">
  Header set Content-Type "application/wasm"
</FilesMatch>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Common Issues & Troubleshooting

### Issue: "expected magic word 00 61 73 6d"

**Cause**: `.wasm` asset not deployed or returned as HTML

**Solution**:
1. Verify `.wasm` file exists in deployment
2. Check web server returns `Content-Type: application/wasm`
3. Ensure SPA fallback does not rewrite `.wasm` requests
4. Check browser DevTools Network tab for actual response

### Issue: Vite development shows WASM MIME type error

**Cause**: Dependency optimization bundling WASM incorrectly

**Solution**:
```bash
rm -rf node_modules/.vite
npm run dev -- --force
```

Ensure `vite.config.js` excludes both packages:
```javascript
optimizeDeps: {
  exclude: ['@appxiom/4react', '@appxiom/web'],
}
```

### Issue: SDK runs during server rendering (SSR)

**Cause**: Import/initialization in server-rendered code

**Solution**: Guard with `typeof window !== 'undefined'` or use a `'use client'` boundary in Next.js.

### Issue: React hook activity not tracked

**Cause**: SDK initialized after React components render

**Solution**: Initialize `@appxiom/4react` before `createRoot(...).render(...)` so instrumentation is installed before hooks run.

### Issue: TypeScript type errors

**Solution**: Ensure proper type imports:

```typescript
import init, { type AXReact } from '@appxiom/4react';
import type { IssueSeverity } from '@appxiom/web';
```

## Best Practices

1. **Initialize early**: Call `init()` in application startup code, before `createRoot(...).render(...)`
2. **Store instance**: Keep reference to `ax` for API calls throughout the app (context, module singleton)
3. **Set user context**: Call `setCustomId()` after user authentication
4. **Error handling**: Wrap init in try/catch for production apps
5. **Environment-specific config**: Load API keys from environment variables
6. **Vite optimization**: Always exclude `@appxiom/4react` and `@appxiom/web` from dependency optimization
7. **WASM MIME type**: Verify server configuration before production
8. **SSR safety**: Always guard initialization with `typeof window !== 'undefined'` or a client boundary
9. **No component wrappers needed**: Automatic React instrumentation requires no hooks or HOCs — just early initialization

## Related Documentation

- [Appxiom React SDK (@appxiom/4react)](../../ax-react/README.md)
- [Appxiom Core Integration Skill](../appxiom-web-core-integration/SKILL.md)
- [Appxiom Goal Tracking Skill](../appxiom-goal-tracking/SKILL.md)
- [WASM Module Source](../../ax-web-core/)
