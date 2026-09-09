# Appxiom Core Integration Skill

Comprehensive guidance for integrating the Appxiom Web SDK (`@appxiom/web`) into web applications.

## Description

This skill provides step-by-step instructions, configuration patterns, and best practices for integrating Appxiom monitoring and telemetry into JavaScript applications. It covers installation, initialization, API usage, and environment-specific configurations for vanilla JS, Vue, Angular, Svelte, and SSR frameworks.

## When to Use

- **New application setup**: Installing and initializing Appxiom SDK in a new web app
- **Existing application integration**: Adding SDK to an established application
- **Framework-specific integration**: Setting up SDK with Vue, Angular, Svelte, Nuxt, SvelteKit
- **SSR/hybrid application**: Configuring SDK for server-rendered applications
- **Vite/bundler configuration**: Setting up webpack, Vite, or other bundlers with WASM support
- **TypeScript projects**: Type-safe SDK integration with full type support
- **Production deployment**: Configuring SDK for production with proper asset handling and MIME types

## Integration Steps

### Step 1: Installation

```bash
npm install @appxiom/web
```

### Step 2: Get API Keys

Obtain from Appxiom dashboard:
- `APP_KEY`: Application identifier
- `PLATFORM_KEY`: Platform identifier

### Step 3: Initialize SDK

#### JavaScript

```javascript
import init from '@appxiom/web';

const ax = await init(
  'YOUR_APP_KEY',
  'YOUR_PLATFORM_KEY',
  'YOUR_APP_VERSION',
  'YOUR_BUILD_IDENTIFIER',
);

// Now use ax API
ax.setCustomId('user-123');
ax.logActivity('App Started');
```

#### TypeScript

```typescript
import init, { type AX } from '@appxiom/web';

const ax: AX = await init(
  'YOUR_APP_KEY',
  'YOUR_PLATFORM_KEY',
  'YOUR_APP_VERSION',
  'YOUR_BUILD_IDENTIFIER',
);
```

### Step 4: Framework-Specific Configuration

#### Vite

Create `vite.config.js` or `vite.config.ts`:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@appxiom/web'],
  },
});
```

Clear cache after adding configuration:
```bash
rm -rf node_modules/.vite
npm run dev -- --force
```

#### Webpack Configuration

Ensure webpack serves `.wasm` files with correct MIME type:

```javascript
module: {
  rules: [
    {
      test: /\.wasm$/,
      type: 'webassembly/async',
    },
  ],
},
experiments: {
  asyncWebAssembly: true,
},
```

#### Vue 3

Initialize in `main.ts`:

```typescript
import { createApp } from 'vue';
import init from '@appxiom/web';
import App from './App.vue';

const app = createApp(App);

init(
  'YOUR_APP_KEY',
  'YOUR_PLATFORM_KEY',
  'YOUR_APP_VERSION',
  'YOUR_BUILD_IDENTIFIER',
).then((ax) => {
  app.config.globalProperties.$ax = ax;
  app.mount('#app');
});
```

Access in components:

```typescript
import { getCurrentInstance } from 'vue';

export default {
  setup() {
    const ax = getCurrentInstance()?.proxy?.$ax;
    return { ax };
  },
};
```

#### Angular

Create an Angular service:

```typescript
// ax.service.ts
import { Injectable } from '@angular/core';
import init, { type AX } from '@appxiom/web';

@Injectable({
  providedIn: 'root',
})
export class AXService {
  private axInstance: AX | null = null;

  async initialize(): Promise<AX> {
    if (this.axInstance) return this.axInstance;

    this.axInstance = await init(
      'YOUR_APP_KEY',
      'YOUR_PLATFORM_KEY',
      'YOUR_APP_VERSION',
      'YOUR_BUILD_IDENTIFIER',
    );
    return this.axInstance;
  }

  getInstance(): AX | null {
    return this.axInstance;
  }
}
```

Initialize in `AppComponent`:

```typescript
import { Component, OnInit } from '@angular/core';
import { AXService } from './ax.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(private axService: AXService) {}

  async ngOnInit() {
    await this.axService.initialize();
  }
}
```

#### Svelte

Initialize in `+layout.svelte`:

```svelte
<script>
  import init from '@appxiom/web';
  import { onMount } from 'svelte';

  let ax;

  onMount(async () => {
    ax = await init(
      'YOUR_APP_KEY',
      'YOUR_PLATFORM_KEY',
      'YOUR_APP_VERSION',
      'YOUR_BUILD_IDENTIFIER',
    );
  });
</script>

<slot />
```

#### SvelteKit

Create `src/lib/ax.ts`:

```typescript
import init, { type AX } from '@appxiom/web';

let axInstance: AX | null = null;

export async function initAX(): Promise<AX> {
  if (axInstance) return axInstance;

  if (typeof window === 'undefined') {
    throw new Error('AX SDK can only be initialized on client side');
  }

  axInstance = await init(
    'YOUR_APP_KEY',
    'YOUR_PLATFORM_KEY',
    'YOUR_APP_VERSION',
    'YOUR_BUILD_IDENTIFIER',
  );
  return axInstance;
}

export function getAX(): AX {
  if (!axInstance) {
    throw new Error('AX SDK not initialized');
  }
  return axInstance;
}
```

Use in `+layout.svelte`:

```svelte
<script>
  import { initAX } from '$lib/ax';
  import { browser } from '$app/environment';

  if (browser) {
    initAX();
  }
</script>

<slot />
```

### Step 5: Public API Usage

#### Set Custom User ID

```javascript
ax.setCustomId('user-12345');
```

#### Track Goals

```javascript
// Start a goal
ax.startGoal('checkout');

// End a goal with metadata and value
ax.endGoal('checkout', { orderId: 'ORD-10023' }, 120.50);
```

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

### Step 6: Production Deployment

#### Build

```bash
npm run build
```

#### Asset Deployment

1. Deploy all build output files
2. Ensure `.wasm` asset is included in deployment
3. Configure web server to serve `.wasm` files with correct MIME type:

```http
Content-Type: application/wasm
```

#### SPA Fallback Configuration

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

Ensure `vite.config.js` has:
```javascript
optimizeDeps: {
  exclude: ['@appxiom/web'],
}
```

### Issue: SDK runs during server rendering (SSR)

**Cause**: Import/initialization in server-rendered code

**Solution**:
```javascript
if (typeof window !== 'undefined') {
  const { default: init } = await import('@appxiom/web');
  const ax = await init(...);
}
```

Or use framework-specific client markers:
- Nuxt: Plugins with `mode: 'client'`
- SvelteKit: `browser` check or `+page.client.ts`

### Issue: TypeScript type errors

**Solution**: Ensure proper type imports:

```typescript
import init, { type AX, type IssueSeverity } from '@appxiom/web';
```

## Best Practices

1. **Initialize early**: Call `init()` in application startup code, before rendering
2. **Store instance**: Keep reference to `ax` for API calls throughout app
3. **Set user context**: Call `setCustomId()` after user authentication
4. **Error handling**: Wrap init in try/catch for production apps
5. **Environment-specific config**: Load API keys from environment variables
6. **Version tracking**: Use semantic versioning for `version` parameter
7. **Build identifiers**: Include CI/CD build ID in `buildIdentifier`
8. **Vite optimization**: Always exclude SDK from dependency optimization
9. **WASM MIME type**: Verify server configuration before production
10. **SSR safety**: Always guard initialization with `typeof window !== 'undefined'`

## Related Documentation

- [Appxiom Core SDK (@appxiom/web)](../../ax-js/README.md)
- [WASM Module Source](../../ax-web-core/)
