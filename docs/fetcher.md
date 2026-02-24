# Fetch Middleware

Snice provides a context-aware fetch implementation with middleware support, allowing you to intercept and modify HTTP requests and responses globally across your application.

## Overview

The `ContextAwareFetcher` class enables you to:

- Add authentication headers automatically to all requests
- Handle errors consistently across your application
- Log HTTP requests and responses
- Transform requests or responses
- Implement retry logic
- Add request/response timing metrics
- Access application and navigation state in middleware

## Basic Usage

```typescript
import { Router, ContextAwareFetcher } from 'snice';

// Create a fetcher instance
const fetcher = new ContextAwareFetcher();

// Attach JWT to outgoing requests
fetcher.use('request', function(request, next) {
  // `this` is bound to the Context instance
  const jwt = this.application.auth?.token;
  if (jwt) {
    request.headers.set('Authorization', `Bearer ${jwt}`);
  }
  return next();
});

// Add response middleware (runs after fetch)
fetcher.use('response', async function(response, next) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return next();
});

// Pass fetcher to Router
const router = Router({
  target: '#app',
  context: { auth: null },
  fetcher
});

router.initialize();
```

## Using Context.fetch in Pages

Once configured, `ctx.fetch` is available in all pages and components that use the `@context` decorator:

```typescript
@page({ tag: 'user-page', routes: ['/users/:id'] })
class UserPage extends HTMLElement {
  private ctx: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @ready()
  async loadUser() {
    try {
      // Middleware is automatically applied
      const user = await this.ctx.fetch('/api/users/123')
        .then(r => r.json());

      console.log('User loaded:', user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }
}
```

## Middleware Types

### Request Middleware

Request middleware runs **before** the actual fetch call. It receives the `Request` object and can modify it before the request is sent.

**Signature:**
```typescript
type RequestMiddleware = (
  this: Context,
  request: Request,
  next: () => Promise<Response>
) => Promise<Response>
```

**Common use cases:**
- Adding authentication headers
- Modifying request URLs (e.g., adding base URL)
- Logging outgoing requests
- Adding custom headers (CSRF tokens, API keys, etc.)
- Request validation

**Example - JWT Bearer Token:**
```typescript
fetcher.use('request', function(request, next) {
  const jwt = this.application.auth?.token; // "eyJhbG...kpXVCJ9.eyJzdWI...I2MjB9.SflKx...sw5c"
  if (jwt) {
    request.headers.set('Authorization', `Bearer ${jwt}`);
  }
  return next();
});

// Handle expired tokens — refresh or redirect to login
fetcher.use('response', async function(response, next) {
  if (response.status === 401) {
    const refreshToken = this.application.auth?.refreshToken;
    if (refreshToken) {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const { token } = await res.json();
        this.application.auth.token = token;
        // Retry original request with new token
        const retry = new Request(response.url, request);
        retry.headers.set('Authorization', `Bearer ${token}`);
        return fetch(retry);
      }
    }
    this.application.auth = null;
    this.application.router?.navigate('/login');
    throw new Error('Session expired');
  }
  return next();
});
```

**Example - Request Logging:**
```typescript
fetcher.use('request', function(request, next) {
  console.log(`[${this.navigation.route}] ${request.method} ${request.url}`);
  return next();
});
```

### Response Middleware

Response middleware runs **after** the fetch call completes. It receives the `Response` object and can inspect or transform it.

**Signature:**
```typescript
type ResponseMiddleware = (
  this: Context,
  response: Response,
  next: () => Promise<Response>
) => Promise<Response>
```

**Common use cases:**
- Error handling based on status codes
- Response transformation
- Logging responses
- Caching
- Performance metrics
- Retry logic

**Example - Error Handling:**
```typescript
fetcher.use('response', async function(response, next) {
  if (!response.ok) {
    const error = await response.text();
    console.error(`[${this.navigation.route}] HTTP ${response.status}:`, error);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return next();
});
```

**Example - Response Logging:**
```typescript
fetcher.use('response', async function(response, next) {
  console.log(`[${this.navigation.route}] Response ${response.status} from ${response.url}`);
  return next();
});
```

**Example - Performance Metrics:**
```typescript
const timings = new Map<string, number>();

fetcher.use('request', function(request, next) {
  timings.set(request.url, Date.now());
  return next();
});

fetcher.use('response', async function(response, next) {
  const start = timings.get(response.url);
  if (start) {
    console.log(`${response.url} took ${Date.now() - start}ms`);
    timings.delete(response.url);
  }
  return next();
});
```

## Accessing Context

Middleware functions have `this` bound to the `Context` instance, giving you access to:

- `this.application` - Application-wide state (user, config, theme, etc.)
- `this.navigation` - Navigation state (current route, route params, placards)
- `this.id` - Unique context instance ID

**Example - Context-Aware Error Handling:**
```typescript
fetcher.use('response', async function(response, next) {
  if (response.status === 401) {
    // Unauthorized - clear user and redirect to login
    this.application.user = null;
    this.application.router?.navigate('/login');
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    // Forbidden - log and show error
    console.error(`Access denied on route: ${this.navigation.route}`);
    throw new Error('Access forbidden');
  }

  return next();
});
```

## Middleware Execution Order

Middleware executes in the order it's registered:

1. Request middleware runs in registration order (first registered = first executed)
2. Actual `fetch()` call happens
3. Response middleware runs in registration order

**Example:**
```typescript
const fetcher = new ContextAwareFetcher();

fetcher.use('request', function(request, next) {
  console.log('Request middleware 1');
  return next();
});

fetcher.use('request', function(request, next) {
  console.log('Request middleware 2');
  return next();
});

fetcher.use('response', async function(response, next) {
  console.log('Response middleware 1');
  return next();
});

fetcher.use('response', async function(response, next) {
  console.log('Response middleware 2');
  return next();
});

// Output when fetch is called:
// Request middleware 1
// Request middleware 2
// (actual fetch happens)
// Response middleware 1
// Response middleware 2
```

## Complete Example

Here's a complete example with authentication, error handling, and logging:

```typescript
import { Router, ContextAwareFetcher } from 'snice';

interface AppContext {
  auth?: {
    token: string;      // JWT access token
    refreshToken: string;
    userId: string;
  };
}

const fetcher = new ContextAwareFetcher();

// Attach JWT to every request
fetcher.use('request', function(request, next) {
  const jwt = this.application.auth?.token;
  if (jwt) {
    request.headers.set('Authorization', `Bearer ${jwt}`);
  }
  return next();
});

// Log all requests
fetcher.use('request', function(request, next) {
  const route = this.navigation.route;
  console.log(`[${route}] ${request.method} ${request.url}`);
  return next();
});

// Handle 401 — attempt token refresh, then redirect on failure
fetcher.use('response', async function(response, next) {
  if (response.status === 401) {
    this.application.auth = undefined;
    this.application.router?.navigate('/login');
    throw new Error('Session expired');
  }

  if (response.status >= 400) {
    const errorText = await response.clone().text();
    console.error(`HTTP ${response.status}:`, errorText);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return next();
});

const router = Router({
  target: '#app',
  context: {},
  fetcher
});

router.initialize();
```

## Important Notes

### Context is Long-Lived

The `Context` instance is created once per Router and persists for the entire application lifetime. This means:

- Middleware is configured once at application startup
- `ctx.fetch` is initialized once and reused
- Middleware can safely reference `this.application` and `this.navigation` as they update in place

### Modifying Request Headers

The `Request` object's `headers` property is mutable — you can call `request.headers.set()` directly in middleware:

```typescript
fetcher.use('request', function(request, next) {
  request.headers.set('X-Custom', 'value');
  return next();
});
```

### No Fetcher Means Native Fetch

If no `fetcher` is provided to the Router, `ctx.fetch` defaults to the native `fetch` function bound to the Context instance:

```typescript
// No fetcher provided
const router = Router({
  target: '#app',
  context: {}
});

// In pages, ctx.fetch is just native fetch (with `this` bound to Context)
```

## API Reference

### ContextAwareFetcher

**Constructor:**
```typescript
new ContextAwareFetcher()
```

**Methods:**

**`use(type: 'request', middleware: RequestMiddleware): void`**

Add request middleware that runs before the fetch call.

**`use(type: 'response', middleware: ResponseMiddleware): void`**

Add response middleware that runs after the fetch call.

**`create(ctx: Context): typeof globalThis.fetch`**

Create a fetch function bound to the given Context instance. This is called internally by the Router.

### Type Definitions

```typescript
type RequestMiddleware = (
  this: Context,
  request: Request,
  next: () => Promise<Response>
) => Promise<Response>

type ResponseMiddleware = (
  this: Context,
  response: Response,
  next: () => Promise<Response>
) => Promise<Response>

interface Fetcher {
  use(type: 'request', middleware: RequestMiddleware): void;
  use(type: 'response', middleware: ResponseMiddleware): void;
  create(ctx: Context): typeof globalThis.fetch;
}
```

## Notes

- **Configure middleware at startup** — don't add middleware inside pages, as it would duplicate on each navigation.

- **Clone responses before reading** — streams can only be read once:
   ```typescript
   fetcher.use('response', async function(response, next) {
     const clone = response.clone();
     const text = await clone.text();
     console.log('Response body:', text);
     return next(); // Original response still has readable body
   });
   ```

- **Always call `next()`** — every middleware must call and return `next()` to continue the chain.
